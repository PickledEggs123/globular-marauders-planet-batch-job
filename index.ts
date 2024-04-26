import {generatePlanet} from "@pickledeggs123/globular-marauders-generator/dist/helpers";

const {PrismaClient} = require("@prisma/client");
const {Storage} = require("@google-cloud/storage");

(async () => {
    // generate seed
    const seed = Math.random().toString(36).slice(2,15) + Math.random().toString(36).slice(2,15) + Math.random().toString(36).slice(2,15);
    console.log(seed.toString());
    const previewFile = `${seed}-preview.mesh.json`;
    const gameFile = `${seed}-game.mesh.json`

    // generate preview meshes
    const mesh = generatePlanet(2, seed, false).meshes[0];

    // generate an image of the map
    // console.log(path.join(__dirname, "../node_modules/@pickledeggs123/globular-marauders-generator/"));
    //
    // await new Promise<void>((resolve) => {
    //     exec.exec("node ./dist/index.js image planet ../../../output.mesh.json", {
    //         cwd: path.join(__dirname, "../node_modules/@pickledeggs123/globular-marauders-generator/"),
    //     }, (error, stdout, stderr) => {
    //         console.log(error);
    //         console.log(stdout);
    //         console.log(stderr);
    //         resolve();
    //     });
    // });
    // await new Promise<void>((resolve) => {
    //     fs.copyFile("../node_modules/@pickledeggs123/globular-marauders-generator/output.mesh.jpeg", "./output.mesh.jpeg", () => {
    //         resolve();
    //     });
    // });

    // generate game meshes
    const gameData = generatePlanet(2, seed, true);
    const {
        meshes,
        spawnPoints,
        buildings,
    } = gameData;

    // upload to google cloud
    let previewUrl: string = "";
    let gameUrl: string = "";
    try {
        const storage = new Storage();
        const bucketName = "globular-marauders-planets";
        await storage.bucket(bucketName).file(previewFile).save(JSON.stringify(mesh), {gzip: true});
        await storage.bucket(bucketName).file(gameFile).save(JSON.stringify({
            meshes,
            spawnPoints,
            buildings,
        }), {gzip: true});
        previewUrl = storage.bucket(bucketName).file(previewFile).publicUrl();
        gameUrl = storage.bucket(bucketName).file(gameFile).publicUrl();
        console.log(previewUrl);
        console.log(gameUrl);
    } catch (e) {
        console.log(e);
        process.exit(1);
    }

    // save to sql server
    const prisma = new PrismaClient();
    try {
        await prisma.$connect();
        await prisma.planet.create({
            data: {
                seed,
                meshUrl: previewUrl,
                meshesUrl: gameUrl,
            }
        });
        await prisma.$disconnect();
    } catch (e) {
        console.log(e);
        await prisma.$disconnect();
        process.exit(1);
    }
    process.exit();
})();
