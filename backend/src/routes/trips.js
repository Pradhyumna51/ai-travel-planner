const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');

router.post('/validate-budget', tripController.validateBudget);
router.post('/generate', tripController.generateItinerary);
router.post('/save', tripController.saveTrip);
router.get('/', tripController.getSavedTrips);
router.get('/:id', tripController.getTripDetails);
router.get('/:id/map-data', tripController.getTripMapData);
router.get('/routes/:routeId/directions', tripController.getRouteDirections);

module.exports = router;
