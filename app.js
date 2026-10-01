
require('dotenv').config();

const fs = require('fs');
const path = require('path');

const TOKEN = process.env.SOLAX_TOKEN;
const INVERTER_SN = process.env.SOLAX_INVERTER_SN;
const BATTERY_SN = process.env.SOLAX_BATTERY_SN;

const BASE_URL =
    'https://openapi-eu.solaxcloud.com/openapi/v2/device/realtime_data';

const DATA_DIR = path.join(__dirname, 'data');
const HISTORY_DIR = path.join(DATA_DIR, 'history');


// ======================================================
// Crear carpetas si no existen
// ======================================================

function prepararDirectorios() {

    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR);
    }

    if (!fs.existsSync(HISTORY_DIR)) {
        fs.mkdirSync(HISTORY_DIR);
    }
}


// ======================================================
// Consultar dispositivo SolaX
// ======================================================

async function consultarDispositivo(sn, deviceType) {

    const params = new URLSearchParams({
        snList: sn,
        deviceType: deviceType.toString(),
        businessType: '1'
    });

    const url = `${BASE_URL}?${params.toString()}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `bearer ${TOKEN}`
        }
    });

    const texto = await response.text();

    if (!response.ok) {
        throw new Error(
            `Error HTTP ${response.status} consultando ${sn}: ${texto}`
        );
    }

    const data = JSON.parse(texto);

    if (data.code !== 10000) {
        throw new Error(
            `SolaX devuelve error consultando ${sn}: ${texto}`
        );
    }

    return data;
}


// ======================================================
// Guardar datos
// ======================================================

function guardarDatos(inversor, bateria) {

    const ahora = new Date();

    const fecha = ahora.toLocaleDateString('en-CA');
    // Ejemplo: 2026-10-01

    const registro = {
        timestamp: ahora.toISOString(),
        fechaLocal: ahora.toLocaleString('es-ES'),

        inverter: inversor,
        battery: bateria
    };


    // --------------------------------------------------
    // Último estado conocido
    // --------------------------------------------------

    const currentFile =
        path.join(DATA_DIR, 'current.json');

    fs.writeFileSync(
        currentFile,
        JSON.stringify(registro, null, 2),
        'utf8'
    );


    // --------------------------------------------------
    // Histórico diario
    // --------------------------------------------------

    const historyFile =
        path.join(
            HISTORY_DIR,
            `${fecha}.jsonl`
        );

    fs.appendFileSync(
        historyFile,
        JSON.stringify(registro) + '\n',
        'utf8'
    );


    console.log('');
    console.log('Datos guardados correctamente');
    console.log('Fecha:', registro.fechaLocal);
    console.log('');
    console.log('Current:');
    console.log(currentFile);
    console.log('');
    console.log('Histórico:');
    console.log(historyFile);
}


// ======================================================
// Programa principal
// ======================================================

async function main() {

    console.log('');
    console.log('==============================');
    console.log('       SOLAX SERVER');
    console.log('==============================');
    console.log('');

    prepararDirectorios();


    console.log('Consultando inversor...');

    const inversor =
        await consultarDispositivo(
            INVERTER_SN,
            1
        );


    console.log('Consultando batería...');

    const bateria =
        await consultarDispositivo(
            BATTERY_SN,
            2
        );


    console.log('Consultas SolaX OK');


    guardarDatos(
        inversor,
        bateria
    );
}


// ======================================================
// Ejecutar
// ======================================================

main()
    .catch(error => {

        console.error('');
        console.error('ERROR:');
        console.error(error.message);
        console.error('');

    });
