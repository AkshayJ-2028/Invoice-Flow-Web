package com.invoiceflow.service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Service;

import com.invoiceflow.entity.Invoice;
import com.invoiceflow.entity.InvoiceItem;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

@Service
public class PdfService {

    private static final Font TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22);
    private static final Font BOLD = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
    private static final Font NORMAL = FontFactory.getFont(FontFactory.HELVETICA, 11);
    private static final Font WHITE_BOLD = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Color.WHITE);

    public byte[] generate(Invoice invoice) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 40, 40, 40, 40);
            PdfWriter.getInstance(document, out);
            document.open();

            document.add(new Paragraph("INVOICE", TITLE));
            document.add(new Paragraph("Invoice No: " + invoice.getInvoiceNumber(), NORMAL));
            document.add(new Paragraph("Issue Date: " + invoice.getIssueDate(), NORMAL));
            document.add(new Paragraph("Due Date: " + invoice.getDueDate(), NORMAL));
            document.add(new Paragraph("Status: " + invoice.getStatus(), NORMAL));
            document.add(new Paragraph(" "));
            document.add(new Paragraph("Bill To:", BOLD));
            document.add(new Paragraph(invoice.getClientName(), NORMAL));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(5);
            table.setWidthPercentage(100);
            table.setWidths(new float[] {4f, 1f, 2f, 1.5f, 2f});
            addHeader(table, "Description");
            addHeader(table, "Qty");
            addHeader(table, "Unit Price");
            addHeader(table, "Tax %");
            addHeader(table, "Total");

            for (InvoiceItem item : invoice.getItems()) {
                addCell(table, item.getDescription(), Element.ALIGN_LEFT);
                addCell(table, String.valueOf(item.getQuantity()), Element.ALIGN_CENTER);
                addCell(table, money(item.getUnitPrice()), Element.ALIGN_RIGHT);
                addCell(table, item.getTaxPercent() + "%", Element.ALIGN_CENTER);
                addCell(table, money(item.getLineTotal()), Element.ALIGN_RIGHT);
            }
            document.add(table);
            document.add(new Paragraph(" "));

            rightLine(document, "Subtotal: " + money(invoice.getSubtotal()), NORMAL);
            rightLine(document, "Tax: " + money(invoice.getTaxTotal()), NORMAL);
            rightLine(document, "Discount: - " + money(invoice.getDiscount()), NORMAL);
            rightLine(document, "Grand Total: " + money(invoice.getGrandTotal()), BOLD);

            if (invoice.getNotes() != null && !invoice.getNotes().isBlank()) {
                document.add(new Paragraph(" "));
                document.add(new Paragraph("Notes: " + invoice.getNotes(), NORMAL));
            }

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Could not generate PDF", e);
        }
    }

    private void addHeader(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, WHITE_BOLD));
        cell.setBackgroundColor(new Color(27, 58, 92));
        cell.setPadding(6);
        table.addCell(cell);
    }

    private void addCell(PdfPTable table, String text, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(text == null ? "" : text, NORMAL));
        cell.setHorizontalAlignment(align);
        cell.setPadding(6);
        table.addCell(cell);
    }

    private void rightLine(Document document, String text, Font font) throws Exception {
        Paragraph p = new Paragraph(text, font);
        p.setAlignment(Element.ALIGN_RIGHT);
        document.add(p);
    }

    private String money(BigDecimal value) {
        BigDecimal v = value == null ? BigDecimal.ZERO : value;
        return "Rs. " + v.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }
}