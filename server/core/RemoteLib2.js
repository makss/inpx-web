const fs = require('fs-extra');
const path = require('path');
const utils = require('./utils');

const FileDownloader = require('./FileDownloader');
const log = new (require('./AppLogger'))().log;//singleton
const ZipReader = require('./ZipReader');

//singleton
let instance = null;

class RemoteLib2 {
    constructor(config) {
        if (!instance) {
            this.config = config;
            this.down = new FileDownloader(config.maxPayloadSize*1024*1024);
            instance = this;
        }

        return instance;
    }

    async getRemoteBook(bookUid, libFolder, libFile) {
        let libFileId = path.parse(libFile).name;
        let url = this.config.remoteLib2.url;

        url = url.replace('${LIBFOLDER}', libFolder)
            .replace('${LIBFILE}', libFile)
            .replace('${LIBFILEID}', libFileId);

        // const down = new FileDownloader(this.config.maxPayloadSize*1024*1024);
        const zipReader = new ZipReader();
        const tmpFile = `${this.config.tempDir}/${utils.randomHexString(30)}`;
        log(`GET ${libFolder}/${libFile} ${url}`);
        try {
            const buf = await this.down.load(`${url}`, {decompress: false});
            await fs.writeFile(`${tmpFile}.zip`, buf);
            await zipReader.open(`${tmpFile}.zip`);
            // log(JSON.stringify(zipReader.zipEntries, null, 4));

            for (const entry of Object.values(zipReader.zipEntries)) {
                if (entry.name.match(/\.fb2$/)) {
                    log(`Extract book:  ${entry.name}`);
                    await zipReader.extractToFile(entry.name, tmpFile);
                    //await utils.gzipFile(`${publicPath}.raw`, publicPath);
                    return tmpFile;
                }
            }
        } catch (e) {
            log(LM_ERR, `FL|${url}|getBook: ${e.message}`);
            throw new Error('502 Bad Gateway');
        } finally {
            await zipReader.close();
            await fs.remove(`${tmpFile}.zip`);
        }
    }
}

module.exports = RemoteLib2;