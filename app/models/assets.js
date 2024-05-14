import mongoose from 'mongoose';
const { Schema } = mongoose;

const AssetSchema = new Schema({

    name:                   {type: String, index: true},
    type:                   String,
    resolution:             {width: String, height: String},
    duration:               String,
    size:                   String,
    thumbnail:              String,
    labels:                 [],
    playlists:              [],
    validity:               {enable:Boolean, startdate:String, enddate:String, starthour:Number, endhour:Number},
    createdAt:              {type: Date, default: Date.now},
    createdBy:              {_id: {type: Schema.ObjectId, ref: 'User'}, name: String}
})

// AssetSchema.index({ installation: 1 });

AssetSchema.statics = {
    load: (id, cb) => {
        this.findOne({_id: id})
            .exec(cb)
    },
    list: (options, cb) => {
        var criteria = options.criteria || {}

        this.find(criteria)
            .sort({name: 1}) // sort by date
            .limit(options.perPage)
            .skip(options.perPage * options.page)
            .exec(cb)
    }
}

export const AssetModel = mongoose.model('Asset', AssetSchema)