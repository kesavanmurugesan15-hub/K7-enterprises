export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const processRow = (row: (string | number)[]) => {
    let finalVal = '';
    for (let j = 0; j < row.length; j++) {
      let innerValue = row[j] === null || row[j] === undefined ? '' : row[j].toString();
      let result = innerValue.replace(/"/g, '""');
      if (result.search(/("|,|\n)/g) >= 0) {
        result = '"' + result + '"';
      }
      if (j > 0) finalVal += ',';
      finalVal += result;
    }
    return finalVal + '\n';
  };

  let csvFile = '';
  for (let i = 0; i < rows.length; i++) {
    csvFile += processRow(rows[i]);
  }

  const blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function printElementById(elementId: string, title?: string) {
  const content = document.getElementById(elementId);
  if (!content) return;

  const printWindow = window.open('', '_blank', 'height=800,width=1000');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title || 'K7 Enterprise Document'}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; font-family: 'Inter', sans-serif; }
          body { margin: 20px; font-size: 13px; color: #20242B; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #E3E6EA; padding: 8px 10px; text-align: left; }
          th { background: #F5F6F8; font-weight: 600; font-size: 12px; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .font-bold { font-weight: 700; }
          .header-box { border-bottom: 2px solid #B71C2C; padding-bottom: 12px; margin-bottom: 15px; }
          @media print {
            body { margin: 0; }
            @page { margin: 1.5cm; }
          }
        </style>
      </head>
      <body>
        ${content.innerHTML}
        <script>
          window.onload = function() {
            window.focus();
            window.print();
            window.close();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
