const path = require("path");
const fs = require("fs");
const config = require("config");
const uuid = require("uuid");
const fileService = require("../services/fileService");
const User = require("../models/User");
const File = require("../models/File");

const SORT_MAP = {
  name: { name: 1 },
  type: { type: 1 },
  date: { date: 1 },
};

class FileController {
  async createDir(req, res) {
    try {
      const { name, type, parent } = req.body;
      const file = new File({ name, type, parent, user: req.user.id });
      const parentFile = await File.findOne({ _id: parent });
      if (!parentFile) {
        file.path = name;
        await fileService.createDir(req, file);
      } else {
        file.path = path.join(parentFile.path, file.name);
        await fileService.createDir(req, file);
        parentFile.children.push(file._id);
        await parentFile.save();
      }
      await file.save();
      return res.json(file);
    } catch (e) {
      console.log(e);
      return res.status(400).json({ message: "Create dir error" });
    }
  }

  async getFiles(req, res) {
    try {
      const { sort, parent } = req.query;
      const sortOption = SORT_MAP[sort] || {};
      const files = await File.find({ user: req.user.id, parent }).sort(sortOption);
      return res.json(files);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ message: "Cannot get files" });
    }
  }

  async uploadFile(req, res) {
    try {
      const file = req.files.file;
      const parent = await File.findOne({ user: req.user.id, _id: req.body.parent });
      const user = await User.findOne({ _id: req.user.id });

      if (user.usedSpace + file.size > user.diskSpace) {
        return res.status(400).json({ message: "Not enough disk space" });
      }

      user.usedSpace += file.size;

      let filePath;
      let fileSavePath;
      if (parent) {
        filePath = path.join(parent.path, file.name);
        fileSavePath = path.join(req.filePath, String(user.id), parent.path, file.name);
      } else {
        filePath = file.name;
        fileSavePath = path.join(req.filePath, String(user.id), file.name);
      }

      if (fs.existsSync(fileSavePath)) {
        return res.status(400).json({ message: "File already exists" });
      }

      await file.mv(fileSavePath);

      const type = file.name.split(".").pop();
      const dbFile = new File({
        name: file.name,
        type,
        size: file.size,
        path: filePath,
        parent: parent ? parent._id : null,
        user: user._id,
      });
      await dbFile.save();
      await user.save();

      return res.json(dbFile);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ message: "Upload error" });
    }
  }

  async downloadFile(req, res) {
    try {
      const file = await File.findOne({ _id: req.query.id, user: req.user.id });
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      const filePath = fileService.getPath(req, file);
      if (fs.existsSync(filePath)) {
        return res.download(filePath, file.name);
      }
      return res.status(400).json({ message: "File not found on disk" });
    } catch (e) {
      console.log(e);
      return res.status(500).json({ message: "Download error" });
    }
  }

  async deleteFile(req, res) {
    try {
      const file = await File.findOne({ _id: req.query.id, user: req.user.id });
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      fileService.deleteFile(req, file);
      await file.deleteOne();
      return res.json({ message: "File deleted" });
    } catch (e) {
      console.log(e);
      return res.status(400).json({ message: "Delete error" });
    }
  }

  async searchFile(req, res) {
    try {
      const files = await File.find({
        user: req.user.id,
        name: { $regex: req.query.search, $options: "i" },
      });
      return res.json(files);
    } catch (e) {
      console.log(e);
      return res.status(400).json({ message: "Search error" });
    }
  }

  async uploadAvatar(req, res) {
    try {
      const file = req.files.file;
      const user = await User.findById(req.user.id);
      const avatarName = uuid.v4() + ".jpg";
      await file.mv(path.join(config.get("staticPath"), avatarName));
      user.avatar = avatarName;
      await user.save();
      return res.json(user);
    } catch (e) {
      console.log(e);
      return res.status(400).json({ message: "Avatar upload error" });
    }
  }

  async deleteAvatar(req, res) {
    try {
      const user = await User.findById(req.user.id);
      const avatarPath = path.join(config.get("staticPath"), user.avatar);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
      user.avatar = null;
      await user.save();
      return res.json(user);
    } catch (e) {
      console.log(e);
      return res.status(400).json({ message: "Avatar delete error" });
    }
  }
}

module.exports = new FileController();
