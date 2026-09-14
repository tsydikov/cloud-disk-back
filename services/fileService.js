const fs = require("fs");
const path = require("path");

class FileService {
  createDir(req, file) {
    const filePath = this.getPath(req, file);
    return new Promise((resolve, reject) => {
      try {
        if (!fs.existsSync(filePath)) {
          fs.mkdirSync(filePath, { recursive: true });
          return resolve({ message: "Directory was created" });
        } else {
          return reject({ message: "Directory already exists" });
        }
      } catch (e) {
        return reject({ message: "File system error" });
      }
    });
  }

  deleteFile(req, file) {
    const filePath = this.getPath(req, file);
    if (file.type === "dir") {
      fs.rmSync(filePath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(filePath);
    }
  }

  getPath(req, file) {
    return path.join(req.filePath, String(file.user), file.path);
  }
}

module.exports = new FileService();