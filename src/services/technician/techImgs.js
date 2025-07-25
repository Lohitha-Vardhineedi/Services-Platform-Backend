import mongoose from 'mongoose';
import Technician from '../../models/authModels/technician.js';
import TechnicianImages from '../../models/technician/techImgs.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

export const createTechImages = async ({ technicianId, files }) => {
  if (!technicianId) {
    const err = new Error("Validation failed");
    err.statusCode = 401;
    err.errors = ["Technician Id is required."];
    throw err;
  }

  if (!mongoose.Types.ObjectId.isValid(technicianId)) {
    const err = new Error("Invalid Technician ID format");
    err.statusCode = 400;
    err.errors = ["Provided Technician ID is not valid."];
    throw err;
  }

  const technician = await Technician.findById(technicianId);
  if (!technician) {
    const err = new Error("Technician not found");
    err.statusCode = 404;
    throw err;
  }

  const existingRecord = await TechnicianImages.findOne({ technicianId });

  const uploadedUrls = [];

  if (files?.photos && files.photos.length > 0) {
    let currentImageCount = existingRecord ? existingRecord.imageUrl.length : 0;

    if (currentImageCount + files.photos.length > 5) {
      const err = new Error("You can upload a maximum of 5 images total.");
      err.statusCode = 400;
      throw err;
    }

    for (let file of files.photos) {
      const filePath = file.path;
      const uploadResult = await cloudinary.uploader.upload(filePath, {
        folder: "TechUploadedPhotos",
      });
      fs.unlinkSync(filePath);
      uploadedUrls.push(uploadResult.secure_url);
    }
  }

  let savedRecord;

  if (existingRecord) {
    existingRecord.imageUrl.push(...uploadedUrls);
    await existingRecord.save();
    savedRecord = existingRecord;
  } else {
    const newTechnicianImages = new TechnicianImages({
      technicianId,
      imageUrl: uploadedUrls,
    });
    await newTechnicianImages.save();
    savedRecord = newTechnicianImages;
  }

  return {
    id: savedRecord._id,
    technicianId: savedRecord.technicianId,
    imageUrl: savedRecord.imageUrl,
  };
};



export const getTechImagesByTechId = async (technicianId) => {
  if (!technicianId) {
    const err = new Error("Validation failed");
    err.statusCode = 401;
    err.errors = ["Technician ID is required."];
    throw err;
  }

  if (!mongoose.Types.ObjectId.isValid(technicianId)) {
    const err = new Error("Invalid Technician ID format.");
    err.statusCode = 400;
    err.errors = ["Provided Technician ID is not valid."];
    throw err;
  }

  const technicianImages = await TechnicianImages.findOne({ technicianId });

  if (!technicianImages) {
    const err = new Error("Technician Images not found.");
    err.statusCode = 404;
    err.errors = ["Technician Images not found."];
    throw err;
  }

  return {
    id: technicianImages._id,
    technicianId: technicianImages.technicianId,
    imageUrl: technicianImages.imageUrl,
  };
};


export const deleteAllTechnicianImages = async (technicianId) => {
  if (!technicianId) {
    const err = new Error("Validation failed");
    err.statusCode = 401;
    err.errors = ["Technician ID is required."];
    throw err;
  }

  if (!mongoose.Types.ObjectId.isValid(technicianId)) {
    const err = new Error("Invalid Technician ID format");
    err.statusCode = 400;
    err.errors = ["Provided Technician ID is not valid."];
    throw err;
  }

  const techImages = await TechnicianImages.find({ technicianId });

  if (!techImages || techImages.length === 0) {
    const err = new Error("No Technician Images found for this technician");
    err.statusCode = 404;
    throw err;
  }

  for (const record of techImages) {
    for (const imageUrl of record.imageUrl) {
      const match = imageUrl.match(/\/([^/]+)\.[a-z]+$/i);
      const publicId = match ? `TechUploadedPhotos/${match[1]}` : null;
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    }
  }

  const result = await TechnicianImages.deleteMany({ technicianId });

  return {
    message: "All technician images deleted successfully.",
    deletedCount: result.deletedCount,
  };
};

export const deleteSingleTechnicianImage = async ( {technicianId, imageUrlToDelete} ) => {
  if (!technicianId || !imageUrlToDelete) {
    const err = new Error("Validation failed");
    err.statusCode = 400;
    err.errors = ["Technician ID and image URL to delete are required."];
    throw err;
  }

  if (!mongoose.Types.ObjectId.isValid(technicianId)) {
    const err = new Error("Invalid Technician ID format.");
    err.statusCode = 400;
    throw err;
  }

  const record = await TechnicianImages.findOne({ technicianId });

  if (!record || !record.imageUrl.includes(imageUrlToDelete)) {
    const err = new Error("Image not found for the given technician.");
    err.statusCode = 404;
    throw err;
  }

  const match = imageUrlToDelete.match(/\/([^/]+)\.[a-z]+$/i);
  const publicId = match ? `TechUploadedPhotos/${match[1]}` : null;

  if (publicId) {
    await cloudinary.uploader.destroy(publicId);
  }

  record.imageUrl = record.imageUrl.filter(url => url !== imageUrlToDelete);
  await record.save();

  return {
    message: "Image deleted successfully.",
    remainingImages: record.imageUrl,
  };
};

