import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import { runSeed } from "./seed/index";

async function main() {
    await runSeed(prisma);
}

main()
    .catch((error) => {
        console.error("❌ Error ejecutando seed:");
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });