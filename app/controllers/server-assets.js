// import path from "path";
// import FFmpeg from "fluent-ffmpeg";
// import probe from "node-ffprobe";

// import gm from "gm";
// const imageMagick = gm.subClass({ imageMagick: true });

import { config } from "../../config/config.js";
import fs from "fs";
// import async from "async";
import mongoose from "mongoose";
// (Asset = mongoose.model("Asset")),
import { AssetModel } from "../models/assets.js";
import _ from "lodash";
import { restwareSendSuccess, restwareSendError } from "../others/restware.js";
import { processFile } from "../others/process-file.js";

const sendResponse = function (res, err) {
    if (err) {
        return restwareSendError(
            res,
            "Assets data queued for processing, but with errors: ",
            err
        );
    } else {
        return restwareSendSuccess(res, "Queued for Processing");
    }
};

export const serverAssetsStoreDetails = async (req, res) => {
    const files = req.body.files;

    const processFiles = async (files) => {
        try {
            for (const filObj of files) {
                const filename = filObj.name.replace(config.filenameRegex, "");
                await processFile(filename, filObj.size, req.body.categories);
            }

            console.log("processed " + files.length + " files");
        } catch (error) {
            console.log("error in processing files: ", error);
        }
    };

    processFiles(files);

    // async.eachSeries(
    //     files,
    //     function (fileObj, array_cb) {
    //         var filename = fileObj.name.replace(config.filenameRegex, "");
    //         await processFile(filename, fileObj.size, req.body.categories, array_cb);
    //     },
    //     function () {
    //         console.log("processed " + files.length + " files");
    //     }
    // );
    sendResponse(res);
};

export const serverAssetsStoreLinkDetails = (name, type, categories, cb) => {
    processFile(name, 0, categories || [], function (err) {
        cb();
    });
};

// export const serverAssetsUpdateObject = (req, res) => {
//     AssetModel.load(req.body.dbdata._id, function (err, asset) {
//         if (err || !asset) {
//             return restwareSendError(res, "Categories saving error", err);
//         } else {
//             delete req.body.dbdata.__v; //do not copy version key
//             asset = _.extend(asset, req.body.dbdata);
//             asset.save(function (err, data) {
//                 if (err)
//                     return restwareSendError(
//                         res,
//                         "Categories saving error",
//                         err
//                     );

//                 return restwareSendSuccess(res, "Categories saved", data);
//             });
//         }
//     });
// };

export const serverAssetsUpdatePlaylist = async (playlist, assets) => {
    try {
        await AssetModel.update(
            { playlists: playlist },
            { $pull: { playlists: playlist } },
            { multi: true }
        );

        await AssetModel.update(
            { name: { $in: assets } },
            { $push: { playlists: playlist } },
            { multi: true }
        );
    } catch (error) {
        console.log("error in db update for playlist in assets " + error);
    }
    return;

    // AssetModel.update(
    //     { playlists: playlist },
    //     { $pull: { playlists: playlist } },
    //     { multi: true },
    //     function (err, num) {
    //         if (err) {
    //             return console.log(
    //                 "error in db update for playlist in assets " + err
    //             );
    //         } else {
    //             //console.log("Deleted playlist from "+num+" records")

    //             AssetModel.update(
    //                 { name: { $in: assets } },
    //                 { $push: { playlists: playlist } },
    //                 { multi: true },
    //                 function (err, num) {
    //                     if (err) {
    //                         return console.log(
    //                             "error in db update for playlist in assets " +
    //                                 err
    //                         );
    //                     } else {
    //                         //console.log("Updated playlist to "+num+" records")
    //                     }
    //                 }
    //             );
    //         }
    //     }
    // );
};
