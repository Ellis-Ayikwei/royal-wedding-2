import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requireAdminFromRequest } from "@/lib/auth";
import { listGuests, guestStats, getSiteSettings } from "@/lib/repo";

const NAVY = "FF0B1730";
const EMERALD = "FF0B5D45";
const IVORY = "FFFAF6EC";

const STATUS_LABEL: Record<string, string> = {
  accepted: "Accepted",
  declined: "Declined",
  pending: "Awaiting response",
};

export async function GET(req: NextRequest) {
  if (!(await requireAdminFromRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [guests, stats, settings] = await Promise.all([
    listGuests(),
    guestStats(),
    getSiteSettings(),
  ]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = settings.coupleNames ?? "Wedding Admin";
  workbook.created = new Date();

  // --- Guest list ---------------------------------------------------------
  const sheet = workbook.addWorksheet("Guest List", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "Name", key: "name", width: 30 },
    { header: "Phone", key: "phone", width: 20 },
    { header: "Status", key: "status", width: 20 },
    { header: "Party Size", key: "guestCount", width: 12 },
    { header: "Attending Count", key: "attending", width: 16 },
    { header: "Message", key: "message", width: 46 },
    { header: "Invitation Link", key: "link", width: 44 },
    { header: "Invited On", key: "createdAt", width: 20 },
    { header: "Responded On", key: "updatedAt", width: 20 },
  ];

  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: IVORY }, size: 11 };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  header.alignment = { vertical: "middle" };
  header.height = 22;

  for (const g of guests) {
    const row = sheet.addRow({
      name: g.name,
      phone: g.phone,
      status: STATUS_LABEL[g.rsvpStatus] ?? g.rsvpStatus,
      guestCount: g.guestCount,
      // Only accepted guests actually occupy seats.
      attending: g.rsvpStatus === "accepted" ? g.guestCount : 0,
      message: g.message ?? "",
      link: `/invite/${g.invitationToken}`,
      createdAt: new Date(g.createdAt),
      updatedAt: g.rsvpStatus === "pending" ? "" : new Date(g.updatedAt),
    });
    row.getCell("createdAt").numFmt = "yyyy-mm-dd hh:mm";
    row.getCell("updatedAt").numFmt = "yyyy-mm-dd hh:mm";
    row.getCell("message").alignment = { wrapText: true, vertical: "top" };

    const statusCell = row.getCell("status");
    if (g.rsvpStatus === "accepted") {
      statusCell.font = { color: { argb: EMERALD }, bold: true };
    } else if (g.rsvpStatus === "declined") {
      statusCell.font = { color: { argb: "FF9A3412" } };
    } else {
      statusCell.font = { color: { argb: "FF6B7280" } };
    }
  }

  sheet.autoFilter = { from: "A1", to: { row: 1, column: sheet.columns.length } };

  // --- Summary ------------------------------------------------------------
  const summary = workbook.addWorksheet("Summary");
  summary.columns = [
    { header: "Metric", key: "metric", width: 30 },
    { header: "Value", key: "value", width: 24 },
  ];
  const summaryHeader = summary.getRow(1);
  summaryHeader.font = { bold: true, color: { argb: IVORY }, size: 11 };
  summaryHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  summaryHeader.height = 22;

  const responded = stats.accepted + stats.declined;
  summary.addRows([
    { metric: "Couple", value: settings.coupleNames ?? "" },
    { metric: "Invitations sent", value: stats.total },
    { metric: "Accepted", value: stats.accepted },
    { metric: "Declined", value: stats.declined },
    { metric: "Awaiting response", value: stats.pending },
    { metric: "Responses received", value: responded },
    {
      metric: "Response rate",
      value: stats.total ? `${Math.round((responded / stats.total) * 100)}%` : "0%",
    },
    { metric: "Total guests attending", value: stats.totalGuestCount },
    { metric: "Exported", value: new Date().toLocaleString("en-GB") },
  ]);

  const buffer = await workbook.xlsx.writeBuffer();
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `guest-list-${stamp}.xlsx`;

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
