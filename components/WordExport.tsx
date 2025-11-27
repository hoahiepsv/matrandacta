import React from 'react';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, AlignmentType, VerticalAlign, VerticalMergeType, Footer, BorderStyle } from 'docx';
import { Download } from 'lucide-react';
import { MatrixData } from '../types';

interface WordExportProps {
  data: MatrixData;
}

const WordExport: React.FC<WordExportProps> = ({ data }) => {

  const generateDoc = async () => {
    // Helper for table headers
    const createHeaderCell = (text: string, rowSpan: number = 1, colSpan: number = 1, width?: number) => {
      return new TableCell({
        rowSpan: rowSpan,
        columnSpan: colSpan,
        width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text, bold: true, font: "Times New Roman", size: 26 })], // Size 26 = 13pt
          }),
        ],
        shading: { fill: "E0F2FE" }, // Light blue background
      });
    };

    // Helper for regular cells
    const createCell = (text: string | number, align: AlignmentType = AlignmentType.LEFT, rowSpanType?: VerticalMergeType) => {
      return new TableCell({
        verticalAlign: VerticalAlign.CENTER,
        verticalMerge: rowSpanType,
        children: [
          new Paragraph({
            alignment: align,
            children: [new TextRun({ text: String(text), font: "Times New Roman", size: 26 })],
          }),
        ],
      });
    };

    /**
     * TOP HEADER SECTION (Invisible Table)
     * Left: Department & School
     * Right: Matrix Title, Subject, Time
     */
    const topHeaderTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.NONE, size: 0, color: "auto" },
            bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
            left: { style: BorderStyle.NONE, size: 0, color: "auto" },
            right: { style: BorderStyle.NONE, size: 0, color: "auto" },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
        },
        rows: [
            new TableRow({
                children: [
                    // Left Column
                    new TableCell({
                        width: { size: 40, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.TOP,
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [new TextRun({ text: data.department_name || "PHÒNG GIÁO DỤC VÀ ĐÀO TẠO", bold: true, font: "Times New Roman", size: 26 })]
                            }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [new TextRun({ text: data.school_name || "TRƯỜNG ....................", bold: true, font: "Times New Roman", size: 26 })]
                            })
                        ]
                    }),
                    // Right Column
                    new TableCell({
                         width: { size: 60, type: WidthType.PERCENTAGE },
                         verticalAlign: VerticalAlign.TOP,
                         children: [
                             new Paragraph({
                                 alignment: AlignmentType.CENTER,
                                 children: [new TextRun({ text: data.title || "MA TRẬN ĐỀ THAM KHẢO KIỂM TRA", bold: true, font: "Times New Roman", size: 26 })]
                             }),
                             new Paragraph({
                                 alignment: AlignmentType.CENTER,
                                 children: [new TextRun({ text: `MÔN: ${data.subject.toUpperCase()}`, bold: true, font: "Times New Roman", size: 26 })]
                             }),
                             new Paragraph({
                                 alignment: AlignmentType.CENTER,
                                 children: [new TextRun({ text: `Thời gian làm bài: ${data.time}`, font: "Times New Roman", size: 26, italics: true })]
                             })
                         ]
                    })
                ]
            })
        ]
    });


    /**
     * DATA TABLE HEADER Structure (3 Rows)
     */
    const headerRow1 = new TableRow({
        children: [
            createHeaderCell("TT", 3, 1, 5),
            createHeaderCell("CHỦ ĐỀ", 3, 1, 10),
            createHeaderCell("NỘI DUNG", 3, 1, 15),
            createHeaderCell("MỨC ĐỘ ĐÁNH GIÁ", 3, 1, 20),
            createHeaderCell("SỐ CÂU HỎI THEO MỨC ĐỘ NHẬN THỨC", 1, 8, 50),
        ]
    });

    const headerRow2 = new TableRow({
        children: [
            createHeaderCell("NHẬN BIẾT", 1, 2),
            createHeaderCell("THÔNG HIỂU", 1, 2),
            createHeaderCell("VẬN DỤNG", 1, 2),
            createHeaderCell("VẬN DỤNG CAO", 1, 2),
        ]
    });

    const headerRow3 = new TableRow({
        children: [
            createHeaderCell("TN"), createHeaderCell("TL"),
            createHeaderCell("TN"), createHeaderCell("TL"),
            createHeaderCell("TN"), createHeaderCell("TL"),
            createHeaderCell("TN"), createHeaderCell("TL"),
        ]
    });


    // Data Rows with Merging
    const tableRows = data.rows.map((row, index) => {
      // Determine Vertical Merge Type for Topic
      let mergeType: VerticalMergeType = VerticalMergeType.CONTINUE;
      
      // If it's the first row, or if the topic is different from previous
      if (index === 0 || row.topic !== data.rows[index - 1].topic) {
          mergeType = VerticalMergeType.RESTART;
      }
      
      return new TableRow({
        children: [
          createCell(row.tt, AlignmentType.CENTER),
          createCell(row.topic, AlignmentType.LEFT, mergeType), // Applied merge here
          createCell(row.content),
          createCell(row.assessment_level),
          createCell(row.recognition_tn > 0 ? row.recognition_tn : "", AlignmentType.CENTER),
          createCell(row.recognition_tl > 0 ? row.recognition_tl : "", AlignmentType.CENTER),
          createCell(row.understanding_tn > 0 ? row.understanding_tn : "", AlignmentType.CENTER),
          createCell(row.understanding_tl > 0 ? row.understanding_tl : "", AlignmentType.CENTER),
          createCell(row.application_tn > 0 ? row.application_tn : "", AlignmentType.CENTER),
          createCell(row.application_tl > 0 ? row.application_tl : "", AlignmentType.CENTER),
          createCell(row.high_application_tn > 0 ? row.high_application_tn : "", AlignmentType.CENTER),
          createCell(row.high_application_tl > 0 ? row.high_application_tl : "", AlignmentType.CENTER),
        ],
      });
    });

    // Detailed Totals Calculation
    const totals = data.rows.reduce((acc, row) => ({
          rec_tn: acc.rec_tn + row.recognition_tn,
          rec_tl: acc.rec_tl + row.recognition_tl,
          und_tn: acc.und_tn + row.understanding_tn,
          und_tl: acc.und_tl + row.understanding_tl,
          app_tn: acc.app_tn + row.application_tn,
          app_tl: acc.app_tl + row.application_tl,
          high_tn: acc.high_tn + row.high_application_tn,
          high_tl: acc.high_tl + row.high_application_tl,
    }), { rec_tn: 0, rec_tl: 0, und_tn: 0, und_tl: 0, app_tn: 0, app_tl: 0, high_tn: 0, high_tl: 0 });

    // Summary Rows
    const summaryRow = new TableRow({
        children: [
            new TableCell({ columnSpan: 4, children: [new Paragraph({ children: [new TextRun({ text: "TỔNG", bold: true, font: "Times New Roman", size: 26 })], alignment: AlignmentType.CENTER })], shading: { fill: "E0F2FE" } }),
            createCell(totals.rec_tn > 0 ? totals.rec_tn : "", AlignmentType.CENTER), 
            createCell(totals.rec_tl > 0 ? totals.rec_tl : "", AlignmentType.CENTER), 
            createCell(totals.und_tn > 0 ? totals.und_tn : "", AlignmentType.CENTER),
            createCell(totals.und_tl > 0 ? totals.und_tl : "", AlignmentType.CENTER),
            createCell(totals.app_tn > 0 ? totals.app_tn : "", AlignmentType.CENTER),
            createCell(totals.app_tl > 0 ? totals.app_tl : "", AlignmentType.CENTER),
            createCell(totals.high_tn > 0 ? totals.high_tn : "", AlignmentType.CENTER),
            createCell(totals.high_tl > 0 ? totals.high_tl : "", AlignmentType.CENTER),
        ]
    });

    const percentRow = new TableRow({
         children: [
            new TableCell({ columnSpan: 4, children: [new Paragraph({ children: [new TextRun({ text: "TỈ LỆ %", bold: true, font: "Times New Roman", size: 26 })], alignment: AlignmentType.CENTER })], shading: { fill: "E0F2FE" } }),
            new TableCell({ columnSpan: 2, children: [new Paragraph({ children: [new TextRun({ text: data.summary.percent_recognition ? `${data.summary.percent_recognition}%` : "", font: "Times New Roman", size: 26 })], alignment: AlignmentType.CENTER })]}),
            new TableCell({ columnSpan: 2, children: [new Paragraph({ children: [new TextRun({ text: data.summary.percent_understanding ? `${data.summary.percent_understanding}%` : "", font: "Times New Roman", size: 26 })], alignment: AlignmentType.CENTER })]}),
            new TableCell({ columnSpan: 2, children: [new Paragraph({ children: [new TextRun({ text: data.summary.percent_application ? `${data.summary.percent_application}%` : "", font: "Times New Roman", size: 26 })], alignment: AlignmentType.CENTER })]}),
            new TableCell({ columnSpan: 2, children: [new Paragraph({ children: [new TextRun({ text: data.summary.percent_high_application ? `${data.summary.percent_high_application}%` : "", font: "Times New Roman", size: 26 })], alignment: AlignmentType.CENTER })]}),
        ]
    });
    
     const generalPercentRow = new TableRow({
         children: [
            new TableCell({ columnSpan: 4, children: [new Paragraph({ children: [new TextRun({ text: "TỈ LỆ CHUNG", bold: true, font: "Times New Roman", size: 26 })], alignment: AlignmentType.CENTER })], shading: { fill: "E0F2FE" } }),
            new TableCell({ columnSpan: 4, children: [new Paragraph({ children: [new TextRun({ text: `${data.summary.general_percent_basic}%`, bold: true, font: "Times New Roman", size: 26 })], alignment: AlignmentType.CENTER })] }),
            new TableCell({ columnSpan: 4, children: [new Paragraph({ children: [new TextRun({ text: `${data.summary.general_percent_advanced}%`, bold: true, font: "Times New Roman", size: 26 })], alignment: AlignmentType.CENTER })] }),
        ]
    });


    const mainTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow1, headerRow2, headerRow3, ...tableRows, summaryRow, percentRow, generalPercentRow],
    });

    const doc = new Document({
      sections: [{
        properties: {
            page: {
                size: {
                    orientation: "landscape",
                },
                margin: {
                    top: 1000,
                    bottom: 1000,
                    left: 1000,
                    right: 1000,
                }
            }
        },
        footers: {
            default: new Footer({
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Bản quyền thuộc về Lê Hoà Hiệp (0983.676.470)",
                                italics: true,
                                color: "808080", // Gray
                                size: 20 // 10pt
                            })
                        ],
                        alignment: AlignmentType.CENTER
                    })
                ]
            })
        },
        children: [
          topHeaderTable,
          new Paragraph({ text: "" }), // Spacing
          new Paragraph({
            children: [
                new TextRun({ text: `BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐÁNH GIÁ ${data.exam_name ? data.exam_name.toUpperCase() : "GIỮA KỲ/CUỐI KỲ"}`, bold: true, size: 32, font: "Times New Roman" }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 100 }
          }),
           new Paragraph({
            children: [
                new TextRun({ text: `Môn: ${data.subject} - Năm học: ${data.school_year}`, bold: true, size: 28, font: "Times New Roman" }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          mainTable,
          new Paragraph({ text: "" }), // Spacing
        ],
      }],
    });

    // Native Browser Save Logic (No file-saver)
    const blob = await Packer.toBlob(doc);
    const fileName = `Ma_Tran_Dac_Ta_${data.subject}_${data.grade}.docx`;
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={generateDoc}
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105"
    >
      <Download className="w-5 h-5" />
      Xuất file Word (.docx)
    </button>
  );
};

export default WordExport;