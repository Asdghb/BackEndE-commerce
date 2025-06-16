
const fs = require("fs");
const PDFDocument = require("pdfkit");
function createInvoice(invoice, pdfpath) {
  return new Promise((resolve, reject) => {
    try {
      let doc = new PDFDocument({ size: "A4", margin: 50 });
      const stream = fs.createWriteStream(pdfpath);
      doc.pipe(stream);
      generateHeader(doc);
      generateCustomerInformation(doc, invoice);
      generateInvoiceTable(doc, invoice);
      generateFooter(doc);
      doc.end();
      stream.on("finish", () => resolve());
      stream.on("error", (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}
function generateHeader(doc) {
  doc
    .fillColor("#444444")
    .fontSize(20)
    .text("ACME Inc.", 110, 57)
    .fontSize(10)
    .text("ACME Inc.", 200, 50, { align: "right" })
    .text("123 Main Street", 200, 65, { align: "right" })
    .text("New York, NY, 10025", 200, 80, { align: "right" })
    .moveDown();
}
function generateCustomerInformation(doc, invoice) {
  doc.fillColor("#444444").fontSize(20).text("Invoice", 50, 160);
  generateHr(doc, 185);
  const top = 200;
  doc
    .fontSize(10)
    .text("Invoice Number:", 50, top)
    .font("Helvetica-Bold")
    .text(invoice.invoice_nr, 150, top)
    .font("Helvetica")
    .text("Invoice Date:", 50, top + 15)
    .text(formatDate(new Date()), 150, top + 15)
    .text("Order price:", 50, top + 30)
    .text(formatCurrency(invoice.paid), 150, top + 30)
    .font("Helvetica-Bold")
    .text(invoice.shipping.name, 300, top)
    .font("Helvetica")
    .text(invoice.shipping.address, 300, top + 15)
    .text(invoice.shipping.country, 300, top + 30)
    .moveDown();
  generateHr(doc, 252);
}
function generateInvoiceTable(doc, invoice) {
  let i;
  const top = 330;
  doc.font("Helvetica-Bold");
  generateTableRow(doc, top, "Item", "item price", "Quantity", "Total price");
  generateHr(doc, top + 20);
  doc.font("Helvetica");
  for (i = 0; i < invoice.items.length; i++) {
    const item = invoice.items[i];
    const pos = top + (i + 1) * 30;
    generateTableRow(
      doc,
      pos,
      item.name,
      formatCurrency(item.itemprice),
      item.quantity,
      formatCurrency(item.totalPrice)
    );
    generateHr(doc, pos + 20);
  }

  const subtotalPos = top + (i + 1) * 30;
  generateTableRow(doc, subtotalPos, "", "Subtotal", "", formatCurrency(invoice.subtotal));

  const discountPos = subtotalPos + 20;
  generateTableRow(doc, discountPos, "", "Discount", "", formatCurrency(invoice.paid - invoice.subtotal));

  const totalPos = discountPos + 25;
  doc.font("Helvetica-Bold");
  generateTableRow(doc, totalPos, "", "Order price", "", formatCurrency(invoice.paid));
  doc.font("Helvetica");
}
function generateFooter(doc) {
  doc
    .fontSize(10)
    .text("Payment is due within 15 days. Thank you for your business.", 50, 780, {
      align: "center",
      width: 500,
    });
}
function generateTableRow(doc, y, item, unitCost, quantity, lineTotal) {
  doc
    .fontSize(10)
    .text(item, 50, y)
    .text(unitCost, 280, y, { width: 90, align: "right" })
    .text(quantity, 370, y, { width: 90, align: "right" })
    .text(lineTotal, 0, y, { align: "right" });
}
function generateHr(doc, y) {
  doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
}
function formatCurrency(value) {
  return "EG" + value;
}
function formatDate(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${year}/${month}/${day}`;
}
module.exports = {
  createInvoice,
};



