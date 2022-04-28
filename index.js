#!/usr/bin/env node

import fetch from 'node-fetch';
import 'dotenv/config'
import {Burly} from "kb-burly";

const API_KEY = process.env['API_KEY'];
const OCTO_ENDPOINT = process.env['OCTO_ENDPOINT'];
const TARGET = parseInt(process.env['TARGET']);

const baseAPIEndpoint = (additional) => {
    let base = Burly(OCTO_ENDPOINT).addSegment('/api');

    if (!!additional && additional.length) {
        return base.addSegment(additional);
    }

    return base;
}

const isWithinWorkHours = () => {
    const now = new Date();
    const hour = now.getHours();

    return hour >= 8 && hour <= 18;
}

function checkEnvironment() {
    return new Promise(resolve => {
        if (!process.env.hasOwnProperty('TARGET')) {
            throw new Error('Missing TARGET in process.env')
        } else if (!process.env.hasOwnProperty('OCTO_ENDPOINT')) {
            throw new Error('Missing OCTO_ENDPOINT in process.env')
        } else if (!process.env.hasOwnProperty('API_KEY')) {
            throw new Error('Missing API_KEY in process.env')
        }

        resolve(true);
    })
}

function makeRequest(url, body = undefined) {
    return fetch(url, {
        method: (!!body ? 'POST' : 'GET'),
        body,
        headers: {
            'X-Api-Key': API_KEY
        }
    });
}

function chainError(err) {
    return Promise.reject(err)
}

function checkResponse(data, key) {
    if (!data.hasOwnProperty(key)) {
        throw new Error('Invalid API response:' + JSON.stringify(data));
    }
}

async function checkVersion() {
    const url = baseAPIEndpoint('/version').get;

    const response = await makeRequest(url);
    const data = await response.json();

    return data.hasOwnProperty('api') && Number(data['api']) >= 0.1;
}

async function getJobInfo() {
    const url = baseAPIEndpoint('/job').get;

    const response = await makeRequest(url);
    const data = await response.json();

    checkResponse(data, 'job');

    return data;
}

async function getBedState() {
    const url = baseAPIEndpoint('/printer').addSegment('/bed').get;
    const response = await makeRequest(url);
    const data = await response.json();

    checkResponse(data, 'bed');
    checkResponse(data['bed'], 'actual');
    checkResponse(data['bed'], 'target');

    return data['bed'];
}

async function heatBed(target) {
    const url = baseAPIEndpoint('/printer').addSegment('/bed').get;
    const body = {
        command: 'target',
        target
    };

    const response = await makeRequest(url, body);

    return response.status === 204;
}

checkEnvironment()
    .then(() => checkVersion())
    .then(versionGood => {
        if (!versionGood) {
            throw new Error('Bad API version');
        }

        return getJobInfo()
    }, chainError)
    .then(jobInfo => {
        if (jobInfo['state'] !== 'Operational') {
            throw new Error('Not doing anything since a job is running')
        }

        return getBedState();
    }, chainError)
    .then(bedState => {
        const currentBedTemp = bedState['actual'];
        const targetBedTemp = bedState['target'];

        console.log('Current bed temp:', currentBedTemp);
        if (isWithinWorkHours() && targetBedTemp === 0) {
            console.log('Heating bed up');
            return heatBed(TARGET);
        } else if (!isWithinWorkHours()) {
            console.log('Cooling bed off');
            return heatBed(0);
        }

        console.log('Nothing to do');
    })
    .catch(err => console.error(err));
