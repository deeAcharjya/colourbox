import * as fs from 'fs';

async function main() {
    try {

        ['ColorTrackClonable', 'CbFactory','NonSignedBids','SalesBook'].forEach(ctx => {

            const jsonStr = fs.readFileSync(`artifacts/contracts/${ctx}.sol/${ctx}.json`).toString();

            console.log(`file read ${ctx}`);

            const jsonData: {
                abi: any;
                bytecode: string;
            } = JSON.parse(jsonStr);

            const outFolder = '../components/Utilities/abi';
            const tsAppOtFolder = '../colourbox/abi';

            [outFolder,tsAppOtFolder].forEach(f=>{
                if (!fs.existsSync(f)) {
                    fs.mkdirSync(f);
                    console.log(`created folder ${f}`);
                }
    
            });

            const binFile = `${outFolder}/${ctx}.bin`;
            const abiFile = `${outFolder}/${ctx}.abi`;
            const jsonFile = `${tsAppOtFolder}/${ctx}.json`;


            [binFile, abiFile,jsonFile].forEach(async f => {
                if (fs.existsSync(f)) {
                    fs.unlinkSync(f);
                    console.log(`removed ${f}`);
                }

            })


            fs.writeFileSync(binFile, jsonData.bytecode);
            console.log(`created file ${binFile}`);

            const abiData = JSON.stringify(jsonData.abi);
            fs.writeFileSync(abiFile,abiData );
            console.log(`created file ${abiFile}`);

            fs.writeFileSync(jsonFile,abiData );
            console.log(`created file ${jsonFile}`);

        });

    } catch (error: any) {
        console.error(`failed to extract abi ${error}`);
        throw error;
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
