
const Follow = require('../Models/FollowModel');
const StudioModel = require('../Models/StudioModel');
const User = require('../Models/UserModel');
const globalErrorHandler = require('../utils/globalErrorHandler');
const axios = require('axios');
const Queries = require('../utils/Queries');
const { API_KEY } = require('../config/defaults');
const createFollow = async (req, res, next) => {
    try {
        const { studioId, actorId, type } = req.body;
        const { id: userId } = req.user;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send({ success: false, message: 'User not found' });
        }
        if (type !== 'actor' && type !== 'studio') {
            return res.status(400).send({ success: false, message: 'Invalid type. Must be "actor" or "studio"' });
        }
        if (type === 'studio') {
            if (!studioId) {
                return res.status(400).send({ success: false, message: 'Studio ID is required for type "studio"' });
            }
            const studio = await StudioModel.findById(studioId);
            if (!studio) {
                return res.status(404).send({ success: false, message: 'Studio not found' });
            }
            const existingFollow = await Follow.findOne({ user: userId, studio: studioId, type: 'studio' });
            if (existingFollow) {
                await Follow.deleteOne({ user: userId, studio: studioId, type: 'studio' });
                return res.status(200).send({ success: true, message: 'Unfollowed studio successfully' });
            }
            const follow = new Follow({
                user: userId,
                studio: studioId,
                actor_id: null,
                type: 'studio'
            });
            await follow.save();
            return res.status(201).send({ success: true, data: follow, message: 'Followed studio successfully' });
        }
        if (type === 'actor') {
            if (!actorId) {
                return res.status(400).send({ success: false, message: 'Actor ID is required for type "actor"' });
            }
            const existingFollow = await Follow.findOne({ user: userId, actor_id: actorId, type: 'actor' });
            if (existingFollow) {
                await Follow.deleteOne({ user: userId, actor_id: actorId, type: 'actor' });
                return res.status(200).send({ success: true, message: 'Unfollowed actor successfully' });
            }
            const follow = new Follow({
                user: userId,
                actor_id: actorId,
                studio: null,
                type: 'actor'
            });
            await follow.save();
            return res.status(201).send({ success: true, data: follow, message: 'Followed actor successfully' });
        }
    } catch (error) {
        globalErrorHandler(error, req, res, next, "Follow");
    }
};
const getFollow = async (req, res, next) => {
    try {
        const { id, role } = req.user;
        const { search, type, status, ...queryKeys } = req.query;
        const searchKey = {};
        const populatePaths = ['studio'];
        if (role !== 'ADMIN') {
            queryKeys.user = id;
        }
        const result = await Queries(Follow, queryKeys, searchKey, populatePath = populatePaths);
        const followData = result?.data || [];
        const studios = [];
        const actorPromises = [];
        followData.forEach(follow => {
            if (follow.type === 'studio' && follow.studio) {
                studios.push({
                    id: follow.studio._id,
                    name: follow.studio.name,
                    logo: follow.studio.logo,
                });
            } else if (follow.type === 'actor' && follow.actor_id) {
                const actorPromise = axios.get(`https://api.themoviedb.org/3/person/${follow.actor_id}?api_key=${API_KEY}`)
                    .then(response => {
                        const actorData = response.data;
                        return {
                            id: follow.actor_id,
                            name: actorData.name,
                            image: `https://image.tmdb.org/t/p/w500${actorData.profile_path}`,
                        };
                    })
                    .catch(error => {
                        console.error(`Error fetching actor with ID ${follow.actor_id}:`, error);
                        return null;
                    });

                actorPromises.push(actorPromise);
            }
        });
        const actors = await Promise.all(actorPromises);
        const validActors = actors.filter(actor => actor !== null);
        res.status(200).send({
            success: true,
            data: {
                studios,
                actors: validActors
            }
        });
    } catch (error) {
        globalErrorHandler(error, req, res, next, "Follow");
    }
};
module.exports = { createFollow, getFollow };
