const express = require('express');
const fs = require('fs');
const { PDFDocument, StandardFonts, degrees, rgb } = require('pdf-lib');

const app = express();

// Variable global para almacenar la información del usuario
let loggedInUser = null;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Ruta para mostrar el formulario de inicio de sesión
app.get('/', (req, res) => {
  res.send(`
    <h1>Iniciar sesión</h1>
    <form method="POST" action="/login">
      <div>
        <label>Nombre de usuario:</label>
        <input type="text" name="username" required>
      </div>
      <div>
        <label>Contraseña:</label>
        <input type="password" name="password" required>
      </div>
      <button type="submit">Iniciar sesión</button>
    </form>
  `);
});

// Ruta para procesar el inicio de sesión
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Verificar las credenciales
  const users = [
    { username: 'Angel', password: 'admin' },
    { username: 'Edison', password: 'admin' },
    { username: 'Andres', password: 'admin' },
    { username: 'Jhoel', password: 'admin' },
    { username: 'Brandom', password: 'admin' },
  ];

  const user = users.find((u) => u.username === username && u.password === password);

  if (user) {
    loggedInUser = user.username;
    res.redirect('/download');
  } else {
    res.send('Credenciales inválidas. Inténtalo de nuevo.');
  }
});

// Ruta protegida para descargar el archivo PDF después de iniciar sesión
app.get('/download', async (req, res) => {
  if (loggedInUser) {
    const pdfPath = 'pdf/Formulario.pdf';

    try {
      const existingPdfBytes = await fs.promises.readFile(pdfPath);

      const pdfDoc = await PDFDocument.create();
      const pages = await pdfDoc.copyPages(await PDFDocument.load(existingPdfBytes), [0]);
      pdfDoc.addPage(pages[0]);

      const firstPage = pdfDoc.getPages()[0];

      const { width, height } = firstPage.getSize();
      const watermarkText = `Nombre: ${loggedInUser}`;
      const smallWatermarkText = '© Derechos Reservados';
      const footerText = `El documento se ha descargado por el usuario: ${loggedInUser}`;

      firstPage.drawText(watermarkText, {
        x: width / 2 - watermarkText.length * 4,
        y: height / 2,
        size: 40,
        font: await pdfDoc.embedFont(StandardFonts.Helvetica),
        color: rgb(0.5, 0.5, 0.5),
        rotate: degrees(-45),
      });

      firstPage.drawText(smallWatermarkText, {
        x: width / 2 - smallWatermarkText.length * 2.5,
        y: height / 4,
        size: 10,
        font: await pdfDoc.embedFont(StandardFonts.Helvetica),
        color: rgb(0.5, 0.5, 0.5),
      });

      firstPage.drawText(footerText, {
        x: 50,
        y: 30,
        size: 8,
        font: await pdfDoc.embedFont(StandardFonts.Helvetica),
        color: rgb(0.5, 0.5, 0.5),
      });

      const modifiedPdfBytes = await pdfDoc.save();

      const modifiedPdfPath = 'pdf/archivo_con_marca_de_agua.pdf';

      await fs.promises.writeFile(modifiedPdfPath, modifiedPdfBytes);

      res.download(modifiedPdfPath, 'archivo_con_marca_de_agua.pdf', (err) => {
        if (err) {
          console.error('Error al descargar el archivo PDF:', err);
          res.status(500).send('Error al descargar el archivo PDF');
        }

        // Eliminar el archivo modificado después de la descarga
        fs.unlinkSync(modifiedPdfPath);
      });
    } catch (error) {
      console.error('Error al manipular el archivo PDF:', error);
      res.status(500).send('Error al manipular el archivo PDF');
    }
  } else {
    res.send('Debes iniciar sesión para descargar el archivo PDF.');
  }
});

app.listen(3000, () => {
  console.log('Servidor escuchando en el puerto 3000');
});
