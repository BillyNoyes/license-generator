#!/usr/bin/env node

import fs from 'fs/promises';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { fetchJson, promptUser } from './utils.js';
import { GITHUB_LICENSES_URL } from './config.js';

const argv = yargs(hideBin(process.argv)).argv;

async function getLicenseData() {
  return await fetchJson(GITHUB_LICENSES_URL);
}

async function getChosenLicenseData(url) {
  return await fetchJson(url);
}

async function promptLicenseType(licenseData) {
  const licenseNames = licenseData.map(license => license.name);

  const question = {
    name: 'license_name',
    type: 'list',
    message: 'Choose a license',
    choices: licenseNames,
    loop: false,
  };

  const chosenLicenseName = await promptUser(question);

  const chosenLicense = licenseData.find(license => license.name === chosenLicenseName);

  return chosenLicense
}

function formatLicenseBody(body, name, year) {
  const formattedBody = body
    .replace(/\[year\]|\<year\>/g, year)
    .replace(/\[fullname\]|\[name\]|\<name of copyright owner\>|\<name of author\>/g, name);

  return formattedBody
}

async function init() {
  try {
    const licenseData = await getLicenseData();
    const selectedLicense = await promptLicenseType(licenseData);

    const name = argv.name || await promptUser({
      name: 'name',
      type: 'input',
      message: 'Enter your name',
      default: 'Name',
    });

    const year = argv.year || await promptUser({
      name: 'year',
      type: 'input',
      message: 'Enter year',
      default: new Date().getFullYear(),
    });

    const chosenLicenseData = await getChosenLicenseData(selectedLicense.url);
    const formattedLicenseBody = formatLicenseBody(chosenLicenseData.body, name, year);

    await fs.writeFile('LICENSE', formattedLicenseBody);
    console.log('LICENSE file has been created successfully.');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

init();