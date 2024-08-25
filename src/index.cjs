const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
const port = 8080;

app.use(express.json());
app.use(express.static('static'));

const videosDir = path.join(__dirname, 'videos');
if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir);
}

app.use('/videos', express.static(videosDir));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/convert', (req, res) => {
    const videoUrl = req.body.url;

    if (!videoUrl) {
        return res.status(400).send({ error: 'No URL provided' });
    }

    const outputTemplate = path.join(videosDir, '%(title)s.%(ext)s');
    const command = `yt-dlp "${videoUrl}" -o "${outputTemplate}" --format mp4 --no-warnings --prefer-free-formats --no-check-certificate`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error('Error during conversion:', error);
            console.error('stderr:', stderr);
            return res.status(500).send({ error: 'Conversion failed' });
        }

        const titleMatch = stdout.match(/^\[download\] Destination: (.+)$/m);
        if (!titleMatch) {
            console.error('Error: Unable to parse output for file name');
            return res.status(500).send({ error: 'Conversion failed' });
        }

        const videoFilePath = titleMatch[1];
        console.log('Conversion complete:', videoFilePath);

        res.json({ downloadUrl: `/videos/${path.basename(videoFilePath)}` });
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
