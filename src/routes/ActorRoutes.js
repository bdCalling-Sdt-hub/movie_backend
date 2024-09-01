const ActorRoutes = require('express').Router();
const { GetActorsTMDB, SaveActor, DeleteActor, GetActors, GetActorDetailsTMDB } = require('../Controller/ActorController');
// const { CreateActor, GetActorList, GetActor } = require('../Controller/ActorController');
const verifyToken = require('../middlewares/Token/verifyToken');
ActorRoutes.get('/admin-tmdb-actor-list', verifyToken, GetActorsTMDB)
    .post('/admin-add-actor', verifyToken, SaveActor)
    .get('/actor-list', GetActors)
    .delete('/delete-actor', verifyToken, DeleteActor)
    .get('/get-actor-details/:id',GetActorDetailsTMDB)
module.exports = ActorRoutes