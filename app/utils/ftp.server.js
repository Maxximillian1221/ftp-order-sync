import * as ftp from 'basic-ftp';
import { Builder } from 'xml2js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export async function testFtpConnection(settings) {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  
  try {
    console.log("Testing connection to FTP server...");
    await client.access({
      host: settings.host,
      port: settings.port,
      user: settings.username,
      password: settings.password,
    });
    console.log("Connected to FTP server successfully");
    
    // Try to navigate to the 'in' directory to verify it exists
    console.log("Attempting to enter 'in' directory...");
    await client.cd('in');
    console.log("Successfully entered 'in' directory");
    
    return true;
  } catch (err) {
    console.error("FTP Connection Test Error:", err.message);
    throw new Error(`FTP connection failed: ${err.message}`);
  } finally {
    console.log("Closing FTP connection");
    client.close();
  }
}

function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.getFullYear() + 
           '-' + 
           String(date.getMonth() + 1).padStart(2, '0') + 
           '-' + 
           String(date.getDate()).padStart(2, '0') + 
           ' ' + 
           String(date.getHours()).padStart(2, '0') + 
           ':' + 
           String(date.getMinutes()).padStart(2, '0') + 
           ':' + 
           String(date.getSeconds()).padStart(2, '0');
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
}

export async function uploadOrderToFtp(settings, orderData) {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  
  // Create temporary file
  const tempDir = os.tmpdir();
  const tempFile = path.join(tempDir, `order_${orderData.name}_${Date.now()}.xml`);
  
  try {
    console.log("Connecting to FTP server...");
    await client.access({
      host: settings.host,
      port: settings.port,
      user: settings.username,
      password: settings.password,
    });
    console.log("Connected to FTP server successfully");

    // Navigate to the 'in' directory
    console.log("Attempting to enter 'in' directory...");
    await client.cd('in');
    console.log("Successfully entered 'in' directory");

    // Create XML structure
    console.log("Creating XML document...");
    console.log("Order date:", orderData.created_at);
    const formattedDate = formatDate(orderData.created_at);
    console.log("Formatted date:", formattedDate);

    const builder = new Builder({
      renderOpts: { pretty: true }
    });

    const xmlObj = {
      'ns0:Orders': {
        '$': {
          'xmlns:ns0': 'http://www.internationaldatasystems.com/velocity/order'
        },
        'Header': [{
          'PartnerId': [orderData.shop],
          'SenderId': [orderData.shop],
          'ReceiverId': ['ShopifyFTP']
        }],
        'Order': [{
          'CustNbr': [orderData.shop],
          'CustomerPoNbr': [orderData.name],
          'OrderDate': [formattedDate],
          'ShipToName': [orderData.shipping_address?.name || ''],
          'ShipToCompany': [orderData.shipping_address?.company || ''],
          'ShipToAddrLine1': [orderData.shipping_address?.address1 || ''],
          'ShipToAddrLine2': [orderData.shipping_address?.address2 || ''],
          'ShipToCity': [orderData.shipping_address?.city || ''],
          'ShipToState': [orderData.shipping_address?.provinceCode || orderData.shipping_address?.province_code || ''],
          'ShipToPostalCode': [orderData.shipping_address?.zip || ''],
          'ShipToCountry': [orderData.shipping_address?.countryCode || orderData.shipping_address?.country_code || ''],
          'LineItems': [{
            'LineItem': orderData.line_items.map((item) => ({
              'ItemNbr': [item.sku || ''],
              'QtyOrdered': [item.quantity.toString()],
              'LineItemUDFs': [{}]
            }))
          }]
        }]
      }
    };

    const xmlString = builder.buildObject(xmlObj);
    console.log("XML document created");
    
    // Write to temporary file
    await fs.writeFile(tempFile, xmlString);
    
    // Upload the file
    const fileName = path.basename(tempFile);
    console.log("Uploading file:", fileName);
    
    await client.uploadFrom(tempFile, fileName);
    console.log("File uploaded successfully");

    return xmlString;
  } catch (err) {
    console.error("FTP Error:", err.message);
    console.error("Full FTP error:", err);
    throw err;
  } finally {
    console.log("Cleaning up...");
    try {
      await fs.unlink(tempFile);
    } catch (e) {
      // Ignore cleanup errors
    }
    console.log("Closing FTP connection");
    client.close();
  }
}
