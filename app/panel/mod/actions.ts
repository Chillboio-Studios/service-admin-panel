"use server";

import { getScopedUser } from "@/lib/auth";
import {
  RBAC_PERMISSION_MODERATION_AGENT,
  RBAC_PERMISSION_MODERATION_DISCOVER,
} from "@/lib/auth/rbacInternal";
import { cases, reports, changelog, users } from "@/lib/db/types";
import { ulid } from "ulid";

export interface CaseWithStats {
  _id: string;
  title: string;
  status: "Open" | "Closed";
  author: string;
  reportCount: number;
  category: string[];
  notes?: string;
}

export interface ReportWithDetails {
  _id: string;
  author_id: string;
  status: "Created" | "Resolved" | "Rejected";
  content: any;
  additional_context: string;
  case_id?: string;
}

export async function fetchAllCases(
  status?: "Open" | "Closed",
): Promise<CaseWithStats[]> {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  try {
    const query = status ? { status } : {};
    const allCases = await cases().find(query).toArray();

    const caseIds = allCases.map((c: any) => c._id);
    const reportCounts = new Map<string, number>();

    if (caseIds.length > 0) {
      const caseReports = await reports()
        .find({ case_id: { $in: caseIds } })
        .toArray();

      caseReports.forEach((report: any) => {
        if (report.case_id) {
          reportCounts.set(
            report.case_id,
            (reportCounts.get(report.case_id) || 0) + 1,
          );
        }
      });
    }

    return allCases.map((caseDoc: any) => ({
      ...caseDoc,
      reportCount: reportCounts.get(caseDoc._id) || 0,
    }));
  } catch (error) {
    console.error("Error fetching cases:", error);
    return [];
  }
}

export async function fetchCaseDetails(caseId: string) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  try {
    const caseDoc = await cases().findOne({ _id: caseId });
    if (!caseDoc) return null;

    const relatedReports = await reports()
      .find({ case_id: caseId })
      .toArray();
    const caseHistory = await changelog()
      .find({ "object.id": caseId, "object.type": "Case" })
      .sort({ _id: -1 })
      .limit(20)
      .toArray();

    return {
      case: caseDoc,
      reports: relatedReports,
      history: caseHistory,
    };
  } catch (error) {
    console.error("Error fetching case details:", error);
    return null;
  }
}

export async function fetchAllReports(
  status?: "Created" | "Resolved" | "Rejected",
): Promise<ReportWithDetails[]> {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  try {
    const query = status ? { status } : {};
    return await reports().find(query).sort({ _id: -1 }).toArray();
  } catch (error) {
    console.error("Error fetching reports:", error);
    return [];
  }
}

export async function createCaseFromReport(reportId: string, title: string) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  try {
    const report = await reports().findOne({ _id: reportId });
    if (!report) throw new Error("Report not found");

    const newCaseId = ulid();
    await cases().insertOne({
      _id: newCaseId,
      title,
      status: "Open",
      author: userEmail,
      category: [],
      notes: report.additional_context,
    });

    await reports().updateOne(
      { _id: reportId },
      { $set: { case_id: newCaseId } },
    );

    await changelog().insertOne({
      _id: ulid(),
      userEmail,
      object: { type: "Case", id: newCaseId },
      type: "comment",
      text: `Case created from report ${reportId}`,
    } as any);

    return { caseId: newCaseId };
  } catch (error) {
    console.error("Error creating case:", error);
    throw error;
  }
}

export async function updateCaseStatus(
  caseId: string,
  newStatus: "Open" | "Closed",
) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  try {
    await cases().updateOne(
      { _id: caseId },
      {
        $set: {
          status: newStatus,
          closed_at: newStatus === "Closed" ? new Date() : undefined,
        },
      },
    );

    await changelog().insertOne({
      _id: ulid(),
      userEmail,
      object: { type: "Case", id: caseId },
      type: "case/status",
      status: newStatus,
    } as any);

    return { success: true };
  } catch (error) {
    console.error("Error updating case status:", error);
    throw error;
  }
}

export async function updateCaseCategory(caseId: string, categories: string[]) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  try {
    await cases().updateOne({ _id: caseId }, { $set: { category: categories as any } });

    await changelog().insertOne({
      _id: ulid(),
      userEmail,
      object: { type: "Case", id: caseId },
      type: "case/categorise",
      category: categories[0],
    } as any);

    return { success: true };
  } catch (error) {
    console.error("Error updating case category:", error);
    throw error;
  }
}

export async function addCaseNote(caseId: string, note: string) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  try {
    await cases().updateOne(
      { _id: caseId },
      { $set: { notes: note } },
    );

    await changelog().insertOne({
      _id: ulid(),
      userEmail,
      object: { type: "Case", id: caseId },
      type: "comment",
      text: note,
    } as any);

    return { success: true };
  } catch (error) {
    console.error("Error adding case note:", error);
    throw error;
  }
}

export async function mergeReportsIntoCase(caseId: string, reportIds: string[]) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  try {
    await reports().updateMany(
      { _id: { $in: reportIds } },
      { $set: { case_id: caseId } },
    );

    await changelog().insertOne({
      _id: ulid(),
      userEmail,
      object: { type: "Case", id: caseId },
      type: "case/add_report",
      reportId: reportIds.join(","),
    } as any);

    return { success: true, mergedCount: reportIds.length };
  } catch (error) {
    console.error("Error merging reports:", error);
    throw error;
  }
}

export async function searchReports(
  query: string,
): Promise<ReportWithDetails[]> {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  try {
    return await reports()
      .find({
        $or: [
          { _id: { $regex: query, $options: "i" } },
          { author_id: { $regex: query, $options: "i" } },
          { additional_context: { $regex: query, $options: "i" } },
        ],
      })
      .toArray();
  } catch (error) {
    console.error("Error searching reports:", error);
    return [];
  }
}

export async function getCaseStatistics() {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  try {
    const [openCases, closedCases, avgReportsPerCase] = await Promise.all([
      cases().countDocuments({ status: "Open" }),
      cases().countDocuments({ status: "Closed" }),
      (async () => {
        const allCases = await cases().find({}).toArray();
        if (allCases.length === 0) return 0;
        const reportCount = await reports().countDocuments({});
        return reportCount / allCases.length;
      })(),
    ]);

    return {
      openCases,
      closedCases,
      totalCases: openCases + closedCases,
      avgReportsPerCase: Math.round(avgReportsPerCase * 100) / 100,
    };
  } catch (error) {
    console.error("Error getting case statistics:", error);
    return {
      openCases: 0,
      closedCases: 0,
      totalCases: 0,
      avgReportsPerCase: 0,
    };
  }
}

export async function exportCasesAsJSON() {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  try {
    const allCases = await fetchAllCases();
    return JSON.stringify(allCases, null, 2);
  } catch (error) {
    console.error("Error exporting cases:", error);
    throw error;
  }
}

export async function exportReportsAsJSON() {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  try {
    const allReports = await fetchAllReports();
    return JSON.stringify(allReports, null, 2);
  } catch (error) {
    console.error("Error exporting reports:", error);
    throw error;
  }
}

export async function getReportsCaseStats() {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  try {
    const [uncasedReports, casedReports] = await Promise.all([
      reports().countDocuments({ case_id: { $exists: false } }),
      reports().countDocuments({ case_id: { $exists: true } }),
    ]);

    return {
      uncased: uncasedReports,
      cased: casedReports,
      total: uncasedReports + casedReports,
    };
  } catch (error) {
    return { uncased: 0, cased: 0, total: 0 };
  }
}
