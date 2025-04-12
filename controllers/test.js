const Test = require("../db/tests");
const jwtKey = process.env.db_url;
const Jwt = require("jsonwebtoken");
const user = require("../db/user");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const streamBuffers = require("stream-buffers");
const path = require("path");

const getTests = async (req, res) => {
  try {
    const data = await Test.find();
    if (data.length > 0) {
      res.send(data);
    } else {
      res.send({ result: "no data found" });
    }
  } catch (error) {
    console.error("Error fetching tests:", error);
    res.status(500).send({ result: "Internal Server Error" });
  }
};

const getVerified = async (req, res) => {
  res.send({ result: "verified" });
};

const postTest = async (req, res) => {
  try {
    const data = new Test(req.body);
    let result = await data.save();
    res.send(result.toObject());
  } catch (error) {
    console.error("Error saving test:", error);
    res.status(500).send({ result: "Internal Server Error" });
  }
};

const deleteTest = async (req, res) => {
  try {
    const id = req.params.id;
    let result = await Test.deleteOne({ _id: id });
    res.status(200).send(result);
  } catch (error) {
    console.error("Error deleting test:", error);
    res.status(500).send({ result: "Internal Server Error" });
  }
};

const updateTest = async (req, res) => {
  try {
    let result = await Test.updateOne(
      { _id: req.params.id },
      { $set: req.body }
    );
    res.send(result);
  } catch (error) {
    console.error("Error updating test:", error);
    res.status(500).send({ result: "Internal Server Error" });
  }
};

const searchTest = async (req, res) => {
  try {
    let result = await Test.find({
      $or: [
        { testName: { $regex: req.params.key, $options: "i" } },
        { testId: { $regex: req.params.key, $options: "i" } },
        { "details.investigation": { $regex: req.params.key, $options: "i" } },
      ],
    });
    res.send(result);
  } catch (error) {
    console.error("Error searching tests:", error);
    res.status(500).send({ result: "Internal Server Error" });
  }
};

function getUniqueReportNumber() {
  const counterFile = "report_counter.txt";
  const today = new Date();
  const date = `${String(today.getDate()).padStart(2, "0")}${String(
    today.getMonth() + 1
  ).padStart(2, "0")}${String(today.getFullYear()).slice(2)}`;

  let newNumber = `${date}001`;

  if (fs.existsSync(counterFile)) {
    const last = fs.readFileSync(counterFile, "utf-8").trim();
    const lastDate = last.slice(0, 6);
    const lastCount = parseInt(last.slice(6));
    if (lastDate === date) {
      newNumber = `${date}${String(lastCount + 1).padStart(3, "0")}`;
    }
  }

  fs.writeFileSync(counterFile, newNumber);
  return newNumber;
}

const drawFooter = (doc) => {
  const footerHeight = 50;
  const pageHeight = doc.page.height;
  // console.log(pageHeight);

  doc.save();
  doc
    .fillColor("#FFD700")
    .opacity(1)
    .rect(0, pageHeight - 50, doc.page.width, 50)
    .fill();
  doc.restore();

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("black")
    .text(
      "This report is not valid for medico-legal purposes.",
      0,
      pageHeight - 45,
      {
        align: "center",
        width: doc.page.width,
      }
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor("black")
    .text(
      "8002883165, 9431261691 |  apkeliye4u@gmail.com",
      0,
      pageHeight - 25,
      {
        width: doc.page.width,
        align: "center",
      }
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("black")
    .text("Authorized Signatory", doc.page.width - 180, pageHeight - 70, {
      width: 150,
      align: "right",
    });
};

const generatereport = async (req, res) => {
  try {
    const {
      patientName,
      age,
      gender,
      testAsked,
      testResults,
      doctorName,
      sampleCollected,
    } = req.body;

    const reportNumber = getUniqueReportNumber();

    // Get today's date in `DD MMM YYYY` format
    const reportDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const bufferStream = new streamBuffers.WritableStreamBuffer();
    const doc = new PDFDocument({ size: "A4", margin: 10 });
    // console.log(doc.page.height);
    doc.pipe(bufferStream);

    // Path to your watermark image

    const logoPath = path.join(__dirname, "logo.png");

    // Add watermark image with transparency (opacity) behind all content
    // Save current state before transformation
    doc.save();

    // Move to center of the page
    doc.translate(doc.page.width / 2.5, (3.2 * doc.page.height) / 4);

    // Rotate 45 degrees
    doc.rotate(-45);

    // Set opacity
    doc.opacity(0.07); // Lower value for lighter watermark

    // Draw image centered after transformation
    doc.image(logoPath, -150, -150, {
      width: 600,
    });

    // Restore to original state (no rotation/opacity leak)
    doc.restore();

    doc.rect(0, 0, doc.page.width, 50).fill("#FFD700");
    doc.image(logoPath, 20, 5, { height: 40 });

    doc.save();
    doc.fillColor("yellow").opacity(0.3).rect(0, 50, doc.page.width, 30).fill();
    doc.restore();

    doc
      .fontSize(9)
      .fillColor("black")
      .text(
        "Nawab Chowk, North-East of Gandhi Stadium, Near GST Office,",
        0,
        55,
        { align: "right", width: doc.page.width - 20 }
      )
      .text("Masjid Road, Begusarai | Phone: 7979945106", {
        align: "right",
        width: doc.page.width - 20,
      });

    const drawWrappedText = (
      doc,
      text,
      x,
      y,
      width,
      fontSize = 11,
      font = "Helvetica"
    ) => {
      doc.font(font).fontSize(fontSize);
      const options = { width: width - 10 }; // Padding: 5 left/right
      const lines = doc.heightOfString(text, options) / fontSize;
      doc.text(text, x + 5, y + 5, options); // Small top/left padding
      return lines;
    };

    let y = 90;
    const pageWidth = doc.page.width;
    const margin = 30;
    const startX = margin;
    const rectWidth = pageWidth - 2 * margin;
    console.log(pageWidth);
    const colWidths = [85, 175, 85, 180];

    const patientRows = [
      ["Name:", patientName, "Referred By:", `Dr. ${doctorName}`],
      ["Report No:", reportNumber, "Sex / Age:", `${gender} / ${age}`],
      ["Collected On:", sampleCollected, "Report Date:", reportDate],
      [
        "Collected At:",
        "Diagnocare, Nawab Chowk, Near Gandhi Stadium towards GST Office",
        "Test Asked For:",
        testAsked,
      ],
    ];

    // Step 1: Dynamically calculate row heights
    doc.font("Helvetica").fontSize(11);
    const rowHeights = patientRows.map((row) => {
      let maxLines = 1;
      for (let i = 0; i < row.length; i++) {
        const text = row[i];
        const width = colWidths[i];
        const height = doc.heightOfString(text, { width: width - 10 }) / 9;
        maxLines = Math.max(maxLines, Math.ceil(height));
      }
      return maxLines * 12; // 12 = line height
    });

    const patientSectionHeight = rowHeights.reduce((sum, h) => sum + h, 0);
    doc.save();
    doc
      .lineWidth(1)
      .roundedRect(startX, y, rectWidth, patientSectionHeight - 10, 10)
      .fillAndStroke("#FFFACD", "black");
    doc.restore();

    // Step 2: Draw wrapped cells using calculated heights
    let currentY = y + 7;
    patientRows.forEach((row, rowIndex) => {
      let x = startX + 10;
      const rowHeight = rowHeights[rowIndex];
      row.forEach((cell, colIndex) => {
        const width = colWidths[colIndex];
        drawWrappedText(
          doc,
          cell,
          x,
          currentY,
          width,
          10,
          colIndex % 2 === 0 ? "Helvetica-Bold" : "Helvetica"
        );
        x += width;
      });
      currentY += rowHeight;
    });

    y = currentY + 10;

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .text("TEST REPORT", startX, y, { align: "center", width: rectWidth });
    y += 20;

    const testColWidths = [160, 115, 130, 130];
    doc
      .fillColor("#fffac0")
      .rect(
        startX,
        y,
        testColWidths.reduce((a, b) => a + b),
        20
      )
      .fill();
    console.log(testColWidths.reduce((a, b) => a + b));
    doc
      .strokeColor("black")
      .moveTo(startX, y)
      .lineTo(startX + testColWidths.reduce((a, b) => a + b), y)
      .stroke();
    doc
      .moveTo(startX, y + 20)
      .lineTo(startX + testColWidths.reduce((a, b) => a + b), y + 20)
      .stroke();

    const testHeaders = ["Investigation", "Result", "Unit", "Reference Range"];
    let x = startX;
    testHeaders.forEach((header, i) => {
      doc
        .fillColor("black")
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(header, x + 5, y + 5, {
          width: testColWidths[i] - 10,
          align: i === 0 ? "left" : "center",
        });
      x += testColWidths[i];
    });

    y += 20;
    console.log(y, doc.page.height);
    testResults.forEach((test) => {
      const { testName, value, min, max, unit } = test;
      const outOfRange =
        parseFloat(value) < parseFloat(min) ||
        parseFloat(value) > parseFloat(max);
      const rowValues = [testName, value, unit, `${min} - ${max}`];

      let x = startX;
      rowValues.forEach((val, i) => {
        doc
          .font(outOfRange ? "Helvetica-Bold" : "Helvetica")
          .fontSize(10)
          .fillColor("black")
          .text(val, x + 5, y + 5, {
            width: testColWidths[i] - 10,
            align: i === 0 ? "left" : "center",
          });
        x += testColWidths[i];
      });
      y += 18;
      console.log(y);
    });
    drawFooter(doc, 1);

    doc.end();
    bufferStream.on("finish", () => {
      const pdfData = bufferStream.getContents();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename=report_${reportNumber}.pdf`
      );
      res.send(pdfData);
    });
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).send({ result: "Internal Server Error" });
  }
};

module.exports = {
  getTests,
  getVerified,
  postTest,
  deleteTest,
  updateTest,
  searchTest,
  generatereport,
};
