import { jsPDF } from "jspdf";

export function downloadReportPDF(reportText: string) {
  const doc = new jsPDF({
    unit: "pt",
    format: "letter"
  });

  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;

  const lines = doc.splitTextToSize(reportText, pageWidth);

  doc.setFont("Courier", "Normal");
  doc.setFontSize(10);

  let y = 40;

  for (const line of lines) {
    if (y > 750) {
      doc.addPage();
      y = 40;
    }
    doc.text(line, margin, y);
    y += 14;
  }

  doc.save("SignalSafe_Fraud_Report.pdf");
}
