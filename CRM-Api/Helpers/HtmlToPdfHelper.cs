using Syncfusion.Drawing;
using Syncfusion.HtmlConverter;
using Syncfusion.Pdf;
using Syncfusion.Pdf.Graphics;
using System.Drawing;
using System;
using System.IO;

namespace CRM_Api.Helpers
{
    public class PDFConvertSettings
    {
        public bool AddHeader { get; set; }
        public string HeaderViewPath { get; set; } = string.Empty;
        public bool AddFooter { get; set; }
        public string FooterViewPath { get; set; } = string.Empty;
    }

    public class HtmlToPdfHelper
    {
        public string GenerateHTMLToPDF(string htmlTemplateText, string contentRootPath, PDFConvertSettings? pdfConvertSettings = null, string? enableForm = null)
        {
            HtmlToPdfConverter htmlConverter = new HtmlToPdfConverter(HtmlRenderingEngine.WebKit);
            WebKitConverterSettings settings = new WebKitConverterSettings();

            // Set WebKit path
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            settings.WebKitPath = Path.Combine(baseDir, "QtBinariesWindows");
            
            // If not found in baseDir, fallback to contentRootPath
            if (!Directory.Exists(settings.WebKitPath))
            {
                settings.WebKitPath = Path.Combine(contentRootPath, "QtBinariesWindows");
            }
            
            if (!string.IsNullOrEmpty(enableForm))
                settings.EnableForm = true;
                
            settings.EnableHyperLink = true;
            settings.EnableJavaScript = true;
            
            // Assign WebKit settings to HTML converter
            htmlConverter.ConverterSettings = settings;

            if (pdfConvertSettings != null)
            {
                if (pdfConvertSettings.AddHeader)
                {
                    settings.PdfHeader = HeaderHTMLtoPDF(contentRootPath, pdfConvertSettings.HeaderViewPath);
                }
                if (pdfConvertSettings.AddFooter)
                {
                    settings.PdfFooter = FooterHTMLtoPDF(contentRootPath, pdfConvertSettings.FooterViewPath);
                }
            }

            // Convert HTML string to PDF
            string baseUrl = Path.Combine(contentRootPath, "Forms");
            PdfDocument document = htmlConverter.Convert(htmlTemplateText, baseUrl);
            
            if (document == null)
                throw new Exception("Syncfusion converter returned null document.");

            if (document.Pages.Count == 0)
            {
                document.Close(true);
                throw new Exception("Syncfusion converter generated a document with zero pages.");
            }

            using (MemoryStream stream = new MemoryStream())
            {
                document.Save(stream);
                byte[] bytes = stream.ToArray();
                document.Close(true);
                
                if (bytes == null || bytes.Length == 0)
                    throw new Exception("Generated PDF stream is empty.");
                    
                return Convert.ToBase64String(bytes);
            }
        }

        private PdfPageTemplateElement FooterHTMLtoPDF(string contentRootPath, string filePath)
        {
            HtmlToPdfConverter htmlConverter = new HtmlToPdfConverter(HtmlRenderingEngine.WebKit);
            WebKitConverterSettings webKitSettings = new WebKitConverterSettings();

            webKitSettings.PdfPageSize = new Syncfusion.Drawing.SizeF(PdfPageSize.A4.Width, 80);
            webKitSettings.Orientation = PdfPageOrientation.Landscape;
            webKitSettings.WebKitPath = Path.Combine(contentRootPath, "QtBinariesWindows");

            webKitSettings.WebKitViewPort = new Syncfusion.Drawing.Size(1024, 0);
            htmlConverter.ConverterSettings = webKitSettings;

            string url = Path.Combine(contentRootPath, filePath);
            PdfDocument document = htmlConverter.Convert(url);

            Syncfusion.Drawing.RectangleF bounds = new Syncfusion.Drawing.RectangleF(0, 0, document.Pages[0].GetClientSize().Width, 80);
            PdfPageTemplateElement footer = new PdfPageTemplateElement(bounds);
            footer.Graphics.DrawPdfTemplate(document.Pages[0].CreateTemplate(), bounds.Location, bounds.Size);
            return footer;
        }

        private static PdfPageTemplateElement HeaderHTMLtoPDF(string contentRootPath, string filePath)
        {
            HtmlToPdfConverter htmlConverter = new HtmlToPdfConverter(HtmlRenderingEngine.WebKit);
            WebKitConverterSettings webKitSettings = new WebKitConverterSettings();

            webKitSettings.PdfPageSize = new Syncfusion.Drawing.SizeF(PdfPageSize.A4.Width, 50);
            webKitSettings.Orientation = PdfPageOrientation.Landscape;
            webKitSettings.WebKitPath = Path.Combine(contentRootPath, "QtBinariesWindows");

            webKitSettings.WebKitViewPort = new Syncfusion.Drawing.Size(1024, 0);
            htmlConverter.ConverterSettings = webKitSettings;

            string url = Path.Combine(contentRootPath, filePath);
            PdfDocument document = htmlConverter.Convert(url);

            Syncfusion.Drawing.RectangleF bounds = new Syncfusion.Drawing.RectangleF(0, 0, document.Pages[0].GetClientSize().Width, 50);
            PdfPageTemplateElement header = new PdfPageTemplateElement(bounds);
            header.Graphics.DrawPdfTemplate(document.Pages[0].CreateTemplate(), bounds.Location, bounds.Size);
            return header;
        }
    }
}
