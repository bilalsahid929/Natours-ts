﻿import { NextFunction, Request, Response } from "express";
import { APIFeatures } from "../utils/apiFeatures";
import TourModel from "./../models/tourModel";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";

export const aliasTopTour = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.query.limit = "5";
  req.query.sort = "price";
  req.query.fields = "name,price,ratingAverage,summary,difficulty";
  next();
};

export const getAllTours = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const features = new APIFeatures<typeof TourModel>(
      TourModel.find(),
      req.query
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const tours = await features.query;

    res.status(200).json({
      status: "success",
      results: tours.length,
      data: { tours },
    });
  }
);

export const createTour = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // we calling the method on the new document
    // const newTour = new Tour({});
    // newTour.save();

    // here we calling the method on the model itself

    const newTour = await TourModel.create(req.body);

    res.status(201).json({
      status: "success",
      results: 1,
      data: { newTour },
    });

    //   res.send('success');
  }
);
export const getTour = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Tour.findOne({_id: req.params.id})
    const tour = await TourModel.findById(req.params.id);
    if (!tour) {
      return next(new AppError(`No tour found with that ID`, 404));
    }
    res.status(200).json({
      status: "success",
      // results: tours.length,
      data: { tour },
    });
  }
);
export const updateTour = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Tour.findOne({_id: req.params.id})
    const tour = await TourModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!tour) {
      return next(new AppError(`No tour found with that ID`, 404));
    }
    res.status(200).json({
      status: "success",
      // results: tours.length,
      data: { tour },
    });
  }
);

export const deleteTour = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const tour = await TourModel.findByIdAndDelete(req.params.id, req.body);
    if (!tour) {
      return next(new AppError(`No tour found with that ID`, 404));
    }
    res.status(204).json({
      status: "success",
      // results: tours.length,
      data: null,
    });
  }
);

// export const getAllTours = async (req: Request, res: Response) => {
//   try {
//     const queryObj = { ...req.query };
//     const excludedFields = ['page', 'sort', 'limit', 'fields'];
//     excludedFields.forEach((el) => delete queryObj[el]);
//     let queryStr = JSON.stringify(queryObj);
//     queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
//     let query = Tour.find(JSON.parse(queryStr));
//     if (req.query.sort) {
//       const sortBy = (req.query.sort as string).split(',').join(' ');
//       query = query.sort(sortBy);
//     } else {
//       query = query.sort('-createdAt');
//     }
//     if (req.query.fields) {
//       const fields = (req.query.fields as string).split(',').join(' ');
//       query = query.select(fields);
//     } else {
//       query = query.select('-__v');
//     }
//     const page = req.query.page ? Number(req.query.page) : 1;
//     const limit = req.query.limit ? Number(req.query.limit) : 100;
//     const skip = (page - 1) * limit;

//     query = query.skip(skip).limit(limit);

//     if (req.query.page) {
//       const numTours = await Tour.countDocuments();
//       if (skip >= numTours) throw new Error('This page does not exist');
//     }

//     const tours = await query;
//     res.status(200).json({
//       status: 'success',
//       results: tours.length,
//       data: { tours },
//     });
//   } catch (error) {
//     res.status(404).json({
//       status: 'fail',
//       message: error,
//     });
//   }
// };
export const getTourStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const stats = await TourModel.aggregate([
      // {
      //   $match: { ratingsAverage: { $gte: 4.5 } },
      // },
      {
        $group: {
          _id: { $toUpper: "$difficulty" },
          numTours: { $sum: 1 },
          numRatings: { $sum: "$ratingsQuantity" },
          avgRating: { $avg: "$ratingsAverage" },
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
      {
        $sort: { avgPrice: 1 },
      },
      {
        $match: { _id: { $ne: "EASY" } },
      },
    ]);

    res.status(200).json({
      status: "success",
      data: {
        stats,
      },
    });
  }
);

export const getMonthlyPlan = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const year = Number(req.params.year) * 1; // 2021

    const plan = await TourModel.aggregate([
      {
        $unwind: "$startDates",
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$startDates" },
          numTourStarts: { $sum: 1 },
          tours: { $push: "$name" },
        },
      },
      {
        $addFields: { month: "$_id" },
      },
      {
        $project: {
          _id: 0,
        },
      },
      {
        $sort: { numTourStarts: -1 },
      },
      {
        $limit: 12,
      },
    ]);

    res.status(200).json({
      status: "success",
      data: {
        plan,
      },
    });
  }
);
