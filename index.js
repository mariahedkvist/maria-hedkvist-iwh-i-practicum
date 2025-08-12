require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.set('view engine', 'pug');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// * Please DO NOT INCLUDE the private app access token in your repo. Don't do this practicum in your normal account.
const PRIVATE_APP_ACCESS = process.env.PRIVATE_APP_ACCESS;
const BASE_URL = 'https://api.hubapi.com/crm/';
const CONCERT_OBJECT_TYPE_ID = '2-145539806';

const client = axios.create({
    baseURL: BASE_URL,
    headers: {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    }
});

// TODO: ROUTE 1 - Create a new app.get route for the homepage to call your custom object data. Pass this data along to the front-end and create a new pug template in the views folder.
app.get('/', async (req, res) => {
    try {
        const result = await client.get('v3/objects/p_concerts?limit=10&properties=concert_name,venue,date&associations=contacts');
        const concerts = result.data.results;

        const concertsWithContacts = await Promise.all(concerts?.map(async (concert) => {
            const associations = concert.associations?.contacts?.results;
            const contactIds = associations?.map(contact => contact.id);
            const contactsResult = await client.post(`v3/objects/contacts/batch/read`, {
                properties: ['firstname', 'lastname', 'email'],
                inputs: contactIds?.map(id => ({ id }))
            });

            return {
                ...concert,
                contacts: contactsResult.data.results || [],
            };
        }));

        res.render('index', { title: 'Home | HubSpot APIs', data: concertsWithContacts });
    } catch (e) {
        console.error(e);
    }
});

// TODO: ROUTE 2 - Create a new app.get route for the form to create or update new custom object data. Send this data along in the next route.
// * Code for Route 2 goes here
app.get('/update-cobj', (req, res) => {
    res.render('updates', { title: 'Update Custom Object Form | Integrating With HubSpot I Practicum' });
});

// TODO: ROUTE 3 - Create a new app.post route for the custom objects form to create or update your custom object data. Once executed, redirect the user to the homepage.
// * Code for Route 3 goes here
app.post('/update-cobj', async (req, res) => {
    const { concert_name, venue, date } = req.body;
    const newConcert = {
        properties: {
            concert_name,
            venue,
            date
        }
    };

    try {
        const response = await client.post(`v3/objects/${CONCERT_OBJECT_TYPE_ID}`, newConcert);
        
        res.redirect('/');
    }
    catch (e) {
        console.error(e);
    }
    console.log(newConcert);
});

// * Localhost
app.listen(3000, () => console.log('Listening on http://localhost:3000'));
