const { model, Schema } = require('mongoose');
const FollowSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    studio: {
        type: Schema.Types.ObjectId,
        ref: 'studio',
        default: null,
    },
    actor_id: {
        type: String,
        default: null,
    },
    type: {
        type: String,
        enum: ['actor', 'studio'],
        required: true,
    }
}, { timestamps: true });

// Pre-save validation hook
FollowSchema.pre('save', function (next) {
    if (this.type === 'studio' && !this.studio) {
        return next(new Error('Studio reference is required when type is "studio"'));
    } else if (this.type === 'actor' && !this.actor_id) {
        return next(new Error('Actor ID is required when type is "actor"'));
    }
    next();
});

const Follow = model('Follow', FollowSchema);

module.exports = Follow;
