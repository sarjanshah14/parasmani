const fs = require('fs');
const https = require('https');

const files = fs.readdirSync('photos')
  .filter(f => f.startsWith('._'))
  .map(f => f.substring(2));

const baseUrl = 'https://www.perfectbearing.co.in/photos/';

async function download(file) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync('photos/' + file)) {
      resolve();
      return;
    }
    const dest = fs.createWriteStream('photos/' + file);
    https.get(baseUrl + encodeURIComponent(file), response => {
      if(response.statusCode !== 200) {
        console.log("Failed " + file + " with " + response.statusCode);
        resolve(); // Continue even if one fails
        return;
      }
      response.pipe(dest);
      dest.on('finish', () => {
        dest.close();
        console.log("Downloaded " + file);
        resolve();
      });
    }).on('error', err => {
      fs.unlink('photos/' + file, () => {});
      console.error("Error " + file, err.message);
      resolve();
    });
  });
}

async function main() {
  for (const f of files) {
    await download(f);
  }
  console.log("All downloads finished.");
}
main();
