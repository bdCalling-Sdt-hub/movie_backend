const Movie = require("../Models/MovieModel");
const StudioModel = require("../Models/StudioModel");
const User = require("../Models/UserModel");

const getOverview = async (req, res) => {
    try {
        const [growthData, totalUser, totalMovie, totalStudio] = await Promise.all([
            User.aggregate([
                {
                    $group: {
                        _id: { $month: "$createdAt" },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ]),
            User.countDocuments({}),
            Movie.countDocuments({}),
            StudioModel.countDocuments({}),
        ]);
        const months = {
            1: 'jan',
            2: 'feb',
            3: 'mar',
            4: 'apr',
            5: 'may',
            6: 'jun',
            7: 'jul',
            8: 'aug',
            9: 'sep',
            10: 'oct',
            11: 'nov',
            12: 'dec'
        };
        const monthlyGrowth = {
            jan: 0,
            feb: 0,
            mar: 0,
            apr: 0,
            may: 0,
            jun: 0,
            jul: 0,
            aug: 0,
            sep: 0,
            oct: 0,
            nov: 0,
            dec: 0
        };
        growthData.forEach(data => {
            monthlyGrowth[months[data._id]] = data.count;
        });


        return res.send({ success: true, data: { overview: monthlyGrowth, totalUser, totalMovie, totalStudio } });
    } catch (error) {
        globalErrorHandler(error, req, res, next, "overview");
    }
}
module.exports = { getOverview }