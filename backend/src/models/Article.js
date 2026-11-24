import mongoose from 'mongoose';
import { CATEGORIES } from '../utils/categories.js';

const SLUGS = CATEGORIES.map((c) => c.slug);
const RETENTION_SECONDS = 60 * 60 * 24 * 90; // stored articles expire 90 days after they were last fetched

const articleSchema = new mongoose.Schema(
  {
    // sha1 of the normalised publisher URL. This is the public id and the duplicate guard.
    urlHash: { type: String, required: true, unique: true, immutable: true },
    gnewsId: { type: String },
    title: { type: String, required: true, trim: true, maxlength: 500 },
    description: { type: String, default: '', trim: true },
    content: { type: String, default: '' }, // GNews returns a truncated excerpt, never the full article
    url: { type: String, required: true },
    image: { type: String, default: null },
    publishedAt: { type: Date, required: true },
    source: {
      name: { type: String, default: 'Unknown source' },
      url: { type: String, default: '' },
    },
    category: { type: String, enum: SLUGS, default: 'other' }, // primary section
    categories: { type: [{ type: String, enum: SLUGS }], default: [] }, // every sport mentioned
    fetchedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true, // createdAt / updatedAt
    bufferCommands: false, // fail fast instead of hanging while MongoDB is down
    autoIndex: false, // indexes are built after connecting (see config/db.js)
  },
);

articleSchema.index({ categories: 1, publishedAt: -1 }); // category pages, related stories
articleSchema.index({ publishedAt: -1 }); // "latest" feed
articleSchema.index({ fetchedAt: 1 }, { expireAfterSeconds: RETENTION_SECONDS }); // freshness checks + retention
articleSchema.index({ title: 'text', description: 'text' }, { weights: { title: 3, description: 1 }, name: 'article_text' });

export const Article = mongoose.models.Article || mongoose.model('Article', articleSchema);
