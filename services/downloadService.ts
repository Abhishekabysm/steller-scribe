import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { Note } from '../types';

// Function to sanitize filename
const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .trim()
    .substring(0, 100) // Limit length
    || 'note'; // Fallback if empty
};


// Create HTML template for PDF
const createPDFTemplate = (note: Note): string => {
  const markdownToHtml = (content: string): string => {
    return content
      .split('\n')
      .map(line => {
        const trimmedLine = line.trim();
        if (trimmedLine === '') return '<div class="spacer"></div>';
        
        // Handle headings
        const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          let text = headingMatch[2];
          // Process markdown in headings too
          text = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
          return `<h${level} class="heading-${level}">${text}</h${level}>`;
        }
        
        // Handle numbered lists
        const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
        if (numberedMatch) {
          let text = numberedMatch[2];
          text = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
          return `<div class="numbered-point"><span class="number">${numberedMatch[1]}.</span> ${text}</div>`;
        }
        
        // Handle bullet points
        if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
          let text = trimmedLine.substring(2);
          text = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
          return `<div class="bullet-point">• ${text}</div>`;
        }
        
        // Handle regular paragraphs with all markdown formatting
        let processedLine = trimmedLine
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/`(.*?)`/g, '<code>$1</code>')
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        
        return `<p class="paragraph">${processedLine}</p>`;
      })
      .join('');
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #2c3e50;
          background: white;
          font-size: 14px;
        }
        
        .pdf-container {
          width: 100%;
          margin: 0;
          padding: 30px;
          background: white;
          min-height: 100vh;
          position: relative;
          box-sizing: border-box;
        }
        
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin: -30px -30px 25px -30px;
          padding: 25px 30px;
          color: white;
          border-radius: 0 0 8px 8px;
        }
        
        .title {
          font-size: 28px;
          font-weight: 700;
          line-height: 1.2;
          margin: 0;
        }
        
        .metadata {
          background: #f8f9fa;
          padding: 15px 20px;
          border-radius: 8px;
          margin-bottom: 25px;
          border-left: 4px solid #667eea;
        }
        
        .date-info {
          font-size: 12px;
          color: #6c757d;
          margin-bottom: 8px;
        }
        
        .tags {
          font-size: 12px;
          color: #495057;
          font-style: italic;
        }
        
        .tags .tag {
          background: #e9ecef;
          padding: 2px 8px;
          border-radius: 12px;
          margin-right: 6px;
          display: inline-block;
          font-weight: 500;
        }
        
        .content {
          line-height: 1.6;
          page-break-inside: auto;
          overflow: hidden;
        }
        
        .spacer {
          height: 8px;
        }
        
        .heading-1 {
          font-size: 24px;
          font-weight: 700;
          color: #2c3e50;
          margin: 25px 0 15px 0;
          padding: 10px 0 8px 0;
          border-bottom: 2px solid #667eea;
          page-break-before: auto;
          page-break-after: avoid;
          page-break-inside: avoid;
          break-inside: avoid;
          display: block;
          min-height: 40px;
        }
        
        .heading-2 {
          font-size: 20px;
          font-weight: 600;
          color: #34495e;
          margin: 20px 0 12px 0;
          padding: 8px 0 4px 0;
          border-bottom: 1px solid #bdc3c7;
          page-break-before: auto;
          page-break-after: avoid;
          page-break-inside: avoid;
          break-inside: avoid;
          display: block;
          min-height: 35px;
        }
        
        .heading-3 {
          font-size: 18px;
          font-weight: 600;
          color: #34495e;
          margin: 18px 0 10px 0;
          padding: 6px 0;
          page-break-before: auto;
          page-break-after: avoid;
          page-break-inside: avoid;
          break-inside: avoid;
          display: block;
          min-height: 30px;
        }
        
        .heading-4, .heading-5, .heading-6 {
          font-size: 16px;
          font-weight: 600;
          color: #34495e;
          margin: 16px 0 8px 0;
          padding: 4px 0;
          page-break-before: auto;
          page-break-after: avoid;
          page-break-inside: avoid;
          break-inside: avoid;
          display: block;
          min-height: 25px;
        }
        
        .paragraph {
          margin: 0 0 10px 0;
          text-align: justify;
          color: #2c3e50;
          line-height: 1.6;
          page-break-inside: auto;
          orphans: 2;
          widows: 2;
        }
        
        .bullet-point {
          margin: 4px 0 4px 20px;
          color: #2c3e50;
          line-height: 1.5;
          page-break-inside: avoid;
          display: block;
        }
        
        .numbered-point {
          margin: 4px 0 4px 0;
          color: #2c3e50;
          line-height: 1.5;
          display: flex;
          align-items: flex-start;
          page-break-inside: avoid;
        }
        
        .numbered-point .number {
          font-weight: 600;
          margin-right: 8px;
          min-width: 20px;
          color: #667eea;
        }
        
        strong {
          font-weight: 600;
          color: #2c3e50;
        }
        
        em {
          font-style: italic;
          color: #34495e;
        }
        
        code {
          background: #f1f3f4;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Monaco', 'Consolas', monospace;
          font-size: 0.9em;
          color: #d63384;
        }
        
        a {
          color: #667eea;
          text-decoration: underline;
        }
        
        .watermark {
          position: fixed;
          bottom: 15px;
          right: 20px;
          font-size: 10px;
          color: #bdc3c7;
          font-weight: 400;
        }
        
        .page-number {
          position: fixed;
          bottom: 15px;
          left: 20px;
          font-size: 10px;
          color: #bdc3c7;
        }
        
        .watermark {
          position: absolute;
          bottom: 15px;
          right: 20px;
          font-size: 10px;
          color: #bdc3c7;
          font-weight: 400;
        }
      </style>
    </head>
    <body>
      <div class="pdf-container">
        <div class="header">
          <h1 class="title">${note.title || 'Untitled Note'}</h1>
        </div>
        
        <div class="metadata">
          <div class="date-info">
            📅 Created: ${new Date(note.createdAt).toLocaleDateString()} &nbsp;&nbsp;&nbsp; 
            📝 Updated: ${new Date(note.updatedAt).toLocaleDateString()}
          </div>
          ${note.tags && note.tags.length > 0 ? `
            <div class="tags">
              🏷️ Tags: ${note.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
          ` : ''}
        </div>
        
        <div class="content">
          ${markdownToHtml(note.content)}
        </div>
        
        <div class="watermark">Downloaded by Stellar Scribe</div>
      </div>
    </body>
    </html>
  `;
};

// Download as PDF using html2canvas + jsPDF
export const downloadAsPDF = async (note: Note): Promise<void> => {
  try {
    console.log('Starting PDF generation for note:', note.title);
    const htmlContent = createPDFTemplate(note);
    
    // Create a temporary container with proper A4 dimensions
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-20000px';
    container.style.left = '0';
    container.style.width = '210mm';
    container.style.minHeight = '297mm';
    container.style.backgroundColor = 'white';
    container.style.zIndex = '-1000';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.overflow = 'visible';
    container.innerHTML = htmlContent;
    
    document.body.appendChild(container);

    // Wait longer for rendering and layout calculation
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get the actual rendered height
    const actualHeight = Math.max(container.scrollHeight, container.offsetHeight);
    
    // Generate canvas with better options for page breaks
    const canvas = await html2canvas(container, {
      scale: 1.5, // Reduced scale to improve performance
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: Math.round(210 * 3.7795),
      height: actualHeight,
      windowWidth: Math.round(210 * 3.7795),
      windowHeight: actualHeight,
      scrollX: 0,
      scrollY: 0,
      logging: false,
      removeContainer: false
    });

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Calculate proper scaling
    const scaleFactor = pdfWidth / (canvas.width * 0.264583); // Convert pixels to mm
    
    // Add content page by page to avoid cutting headings
    const pageHeightInPx = pdfHeight / 0.264583 / scaleFactor;
    const totalPages = Math.ceil(canvas.height / pageHeightInPx);
    
    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      if (pageNum > 0) {
        pdf.addPage();
      }
      
      const sourceY = pageNum * pageHeightInPx;
      const sourceHeight = Math.min(pageHeightInPx, canvas.height - sourceY);
      
      if (sourceHeight > 0) {
        // Create a temporary canvas for this page
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;
        const pageCtx = pageCanvas.getContext('2d');
        
        if (pageCtx) {
          pageCtx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);
          const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
          
          const pageHeight = sourceHeight * 0.264583 * scaleFactor;
          pdf.addImage(pageImgData, 'PNG', 0, 0, pdfWidth, pageHeight);
        }
      }
    }
    
    // Save the PDF
    const filename = sanitizeFilename(note.title) + '.pdf';
    pdf.save(filename);
    
    // Clean up
    document.body.removeChild(container);
    console.log('PDF generated successfully');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF: ' + (error as Error).message);
  }
};

// Function to parse markdown for DOCX format
const parseMarkdownForDOCX = (content: string): any[] => {
  const children: any[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine === '') {
      children.push(new Paragraph({ children: [new TextRun({ text: '' })] }));
      continue;
    }

    // Handle headings
    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = Math.min(headingMatch[1].length, 6);
      const headingLevel = [
        HeadingLevel.HEADING_1,
        HeadingLevel.HEADING_2, 
        HeadingLevel.HEADING_3,
        HeadingLevel.HEADING_4,
        HeadingLevel.HEADING_5,
        HeadingLevel.HEADING_6
      ][level - 1] || HeadingLevel.HEADING_1;

      const headingTextRuns = parseInlineMarkdown(headingMatch[2]);
      children.push(
        new Paragraph({
          children: headingTextRuns.map(run => new TextRun({ ...run, bold: true })),
          heading: headingLevel,
          spacing: { before: 200, after: 200 },
        })
      );
      continue;
    }

    // Handle numbered lists
    const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      const textRuns = parseInlineMarkdown(`${numberedMatch[1]}. ${numberedMatch[2]}`);
      children.push(
        new Paragraph({
          children: textRuns.map(run => new TextRun({ ...run, size: 22 })),
          spacing: { after: 120 },
        })
      );
      continue;
    }

    // Handle bullet points
    if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
      const bulletText = trimmedLine.substring(2);
      const textRuns = parseInlineMarkdown(`• ${bulletText}`);
      children.push(
        new Paragraph({
          children: textRuns.map(run => new TextRun({ ...run, size: 22 })),
          spacing: { after: 120 },
        })
      );
      continue;
    }

    // Handle regular paragraphs
    const textRuns = parseInlineMarkdown(trimmedLine);
    children.push(
      new Paragraph({
        children: textRuns.map(run => new TextRun({ ...run, size: 22 })),
        spacing: { after: 120 },
      })
    );
  }

  return children;
};

// Function to parse inline markdown formatting
const parseInlineMarkdown = (text: string): Array<{text: string, bold?: boolean, italics?: boolean}> => {
  // Process markdown patterns in order of priority (bold first, then italic)
  let processedText = text;
  const runs: Array<{text: string, bold?: boolean, italics?: boolean}> = [];
  
  // First, handle bold text (**text**)
  processedText = processedText.replace(/\*\*(.*?)\*\*/g, (_, content) => {
    return `__BOLD_START__${content}__BOLD_END__`;
  });
  
  // Then handle italic text (*text*) - but avoid conflicts with bold
  processedText = processedText.replace(/(?<!\*)(\*)(?!\*)([^*]+?)(\*)(?!\*)/g, (_, __, content) => {
    return `__ITALIC_START__${content}__ITALIC_END__`;
  });
  
  // Handle code spans (`text`)
  processedText = processedText.replace(/`(.*?)`/g, (_, content) => {
    return content; // Just remove backticks for DOCX
  });
  
  // Now split the text and create runs
  const parts = processedText.split(/(__BOLD_START__|__BOLD_END__|__ITALIC_START__|__ITALIC_END__)/);
  
  let currentStyle = { bold: false, italics: false };
  
  for (const part of parts) {
    if (part === '__BOLD_START__') {
      currentStyle.bold = true;
    } else if (part === '__BOLD_END__') {
      currentStyle.bold = false;
    } else if (part === '__ITALIC_START__') {
      currentStyle.italics = true;
    } else if (part === '__ITALIC_END__') {
      currentStyle.italics = false;
    } else if (part && part.trim()) {
      // Add text run with current style
      runs.push({
        text: part,
        bold: currentStyle.bold || undefined,
        italics: currentStyle.italics || undefined
      });
    }
  }
  
  // If no formatting found, return original text
  if (runs.length === 0) {
    runs.push({ text });
  }
  
  return runs;
};

// Download as DOCX
export const downloadAsDOCX = async (note: Note): Promise<void> => {
  try {
    const children: any[] = [];

    // Title
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: note.title || 'Untitled Note',
            bold: true,
            size: 32,
          }),
        ],
        spacing: { after: 300 },
      })
    );

    // Date
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `📅 Created: ${new Date(note.createdAt).toLocaleDateString()}    📝 Updated: ${new Date(note.updatedAt).toLocaleDateString()}`,
            size: 20,
            italics: true,
          }),
        ],
        spacing: { after: 200 },
      })
    );

    // Tags
    if (note.tags && note.tags.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `🏷️ Tags: ${note.tags.join(' • ')}`,
              size: 20,
              italics: true,
            }),
          ],
          spacing: { after: 400 },
        })
      );
    }

    // Content - use the new markdown parser
    const contentChildren = parseMarkdownForDOCX(note.content);
    children.push(...contentChildren);

    const doc = new Document({
      sections: [
        {
          properties: {},
          children,
        },
      ],
    });

    // Generate and save
    const blob = await Packer.toBlob(doc);
    const filename = sanitizeFilename(note.title) + '.docx';
    saveAs(blob, filename);
  } catch (error) {
    console.error('Error generating DOCX:', error);
    throw new Error('Failed to generate DOCX');
  }
};
