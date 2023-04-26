const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username : {
        type: String,
        required : true
    },
    password_hash : {
        type: String,
        required : true
    },
    fullname : {
        type: String,
        required : true
    },
    gender : {
        type: String,
        required : true
    },
    votings : {
        type: Array,
        required : true
    }
})
// Votings format -> [entry_id,vote_side]


const pollSchema = new mongoose.Schema({
    entry_title : {
        type : String,
        required : true
    },
    entry_desc : {
        type : String,
        required : true
    },
    created_on : {
        type: Date,
        required : true
    },
    alpha_title : {
        type : String,
        required : true
    },
    beta_title : {
        type : String,
        required : true
    },
    total_votings : {
        type : Number,
        default : 0,
    },
    voting_accounts_alpha : {
        type : Array,
        required : true
    },
    voting_accounts_beta : {
        type : Array,
        required : true
    },
    online_status: {
        type: Boolean,
        required : true
    }
})

const completedEntries = new mongoose.Schema({
    entry_details : {
        type : String, 
        required : true,
    },
    expiration_date : {
        type : Date,
        default : Date.now()
    }
})


const POLL = mongoose.model('POLL', pollSchema)
const USER = mongoose.model('USER', userSchema)
const HISTORY = mongoose.model('HISTORY', completedEntries)

module.exports = {
    USER : USER,
    POLL : POLL,
    HISTORY : HISTORY
}