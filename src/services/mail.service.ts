import { Sale, SaleItem } from '@models/sale.model';
import { query } from '@config/database';
import { configurationService } from './configuration.service';
import { logger } from '@config/logger';

// --- Placeholder for an email sending library ---
// NOTE: In a real application, replace this with Nodemailer or a similar library.
// For now, it logs the email content to the console.
const mailer = {
  sendMail: (options: { to: string; subject: string; html: string }) => {
    logger.info(`--- SIMULATING EMAIL SEND ---`);
    logger.info(`TO: ${options.to}`);
    logger.info(`SUBJECT: ${options.subject}`);
    logger.debug(`HTML CONTENT: ${options.html.substring(0, 500)}...`);
    logger.info(`-----------------------------`);
    return true; // Simulate success
  },
};
// ------------------------------------------------

/**
 * Fetching the detailed sale information required for the receipt.
 * @param saleId The ID of the completed sale.
 * @returns A promise resolving to the Sale and its SaleItem details.
 */
const getSaleDetailsForReceipt = async (
  saleId: string
): Promise<{ sale: Sale; items: SaleItem[] }> => {
  // Query to fetch the main sale record
  const saleSql = `SELECT * FROM sales WHERE id = $1`;
  const saleRows = await query<Sale>(saleSql, [saleId]);
  const sale = saleRows[0];

  if (!sale) {
    throw new Error(`Sale with ID ${saleId} not found.`);
  }

  // Query to fetch all items associated with the sale
  const itemsSql = `SELECT * FROM sale_items WHERE sale_id = $1`;
  const itemRows = await query<SaleItem>(itemsSql, [saleId]);

  return { sale, items: itemRows };
};

/**
 * Generating the HTML content for the sales receipt email.
 * @param sale The main sale object.
 * @param items The array of sold items.
 * @param config The application configurations (e.g., company name).
 * @returns The generated HTML string.
 */
const generateReceiptHtml = (sale: Sale, items: SaleItem[], config: Map<string, string>): string => {
  const companyName = config.get('COMPANY_NAME') || 'POS System';

  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px 10px; border-bottom: 1px solid #eee;">${item.modelNameAtSale}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #eee; text-align: right;">1</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.unitPrice.toFixed(2)}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.unitPrice.toFixed(2)}</td>
      </tr>
      `
    )
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
      <h2 style="color: #333; border-bottom: 2px solid #5cb85c; padding-bottom: 10px; text-align: center;">${companyName}</h2>
      <p style="text-align: center; color: #777;">Thank you for your purchase!</p>
      
      <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 5px;">
        <p><strong>Receipt No:</strong> ${sale.receiptNo}</p>
        <p><strong>Date:</strong> ${new Date(sale.saleDate).toLocaleString()}</p>
        <p><strong>Customer:</strong> ${sale.customerName}</p>
        <p><strong>Phone:</strong> ${sale.customerPhone || 'N/A'}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background: #f0f0f0;">
            <th style="padding: 10px; text-align: left;">Description</th>
            <th style="padding: 10px; text-align: right;">Qty</th>
            <th style="padding: 10px; text-align: right;">Price</th>
            <th style="padding: 10px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 10px 10px 5px; text-align: right; font-weight: bold;">SUBTOTAL:</td>
            <td style="padding: 10px 10px 5px; text-align: right; font-weight: bold;">$${sale.totalAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 5px 10px 10px; text-align: right; font-weight: bold; font-size: 1.2em; color: #5cb85c;">TOTAL PAID:</td>
            <td style="padding: 5px 10px 10px; text-align: right; font-weight: bold; font-size: 1.2em; color: #5cb85c;">$${sale.totalAmount.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <p style="margin-top: 30px; text-align: center; font-size: 0.9em; color: #999;">
        Sales Person ID: ${sale.soldByUserId}
        <br>
        This receipt serves as proof of purchase.
      </p>
    </div>
  `;
};

/**
 * Public method to send the sales receipt.
 * @param saleId The ID of the sale to send the receipt for.
 * @param customerEmail The email address of the customer.
 */
export const sendReceipt = async (saleId: string, customerEmail: string): Promise<boolean> => {
  try {
    // 1. Fetch sale details
    const { sale, items } = await getSaleDetailsForReceipt(saleId);

    // 2. Fetch configurations (using the cached service instance)
    const configMap = new Map<string, string>();
    configMap.set('COMPANY_NAME', configurationService.getByKey('COMPANY_NAME') || 'POS');
    configMap.set('SUPPORT_EMAIL', configurationService.getByKey('SUPPORT_EMAIL') || 'support@pos.com');
    // Add other necessary configs...

    // 3. Generate HTML content
    const htmlContent = generateReceiptHtml(sale, items, configMap);

    // 4. Send the email using the placeholder mailer
    const subject = `Your Receipt from ${configMap.get('COMPANY_NAME')} - #${sale.receiptNo}`;
    mailer.sendMail({
      to: customerEmail,
      subject: subject,
      html: htmlContent,
    });

    // 5. Update the sale record to mark email as sent
    await query(`UPDATE sales SET email_sent = TRUE WHERE id = $1`, [saleId]);

    return true;
  } catch (error) {
    logger.error(`Failed to send receipt for Sale ID ${saleId}:`, error);
    // Returning false on failure but not blocking the main thread/response
    return false;
  }
};