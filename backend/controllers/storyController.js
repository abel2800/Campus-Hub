const { Story, User, StoryLike, StoryComment } = require('../models');
const { Op } = require('sequelize');
const { rejectIfSensitive, normalizeText } = require('../utils/contentModeration');

// Get all stories from friends and user's own stories
const getStories = async (req, res) => {
  try {
    const userId = req.user.id;

    const friendQuery = `
      SELECT "friendId" as id FROM "Friends" WHERE "userId" = :userId
      UNION
      SELECT "userId" as id FROM "Friends" WHERE "friendId" = :userId
      UNION
      SELECT :userId as id
    `;

    const friendIds = await Story.sequelize.query(friendQuery, {
      replacements: { userId },
      type: Story.sequelize.QueryTypes.SELECT,
      raw: true,
    });

    const userIds = friendIds.map((friend) => friend.id);

    const stories = await Story.findAll({
      where: {
        userId: { [Op.in]: userIds },
        expiresAt: { [Op.gt]: new Date() },
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar'],
        },
        {
          model: StoryComment,
          as: 'storyComments',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'avatar'],
            },
          ],
          separate: true,
          order: [['createdAt', 'ASC']],
          limit: 30,
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const storyIds = stories.map((s) => s.id);
    const myLikes = storyIds.length
      ? await StoryLike.findAll({
          where: { userId, storyId: { [Op.in]: storyIds } },
          attributes: ['storyId'],
        })
      : [];
    const likedSet = new Set(myLikes.map((l) => l.storyId));

    // For the current user's own stories, include who liked them
    const ownStoryIds = stories.filter((s) => s.userId === userId).map((s) => s.id);
    const likersByStory = {};
    if (ownStoryIds.length) {
      const allLikes = await StoryLike.findAll({
        where: { storyId: { [Op.in]: ownStoryIds } },
        include: [{ model: User, as: 'user', attributes: ['id', 'username', 'avatar'] }],
        order: [['createdAt', 'DESC']],
      });
      allLikes.forEach((like) => {
        if (!likersByStory[like.storyId]) likersByStory[like.storyId] = [];
        likersByStory[like.storyId].push({
          id: like.user?.id,
          username: like.user?.username,
          avatar: like.user?.avatar,
          likedAt: like.createdAt,
        });
      });
    }

    const payload = stories.map((story) => {
      const json = story.toJSON();
      json.isLiked = likedSet.has(story.id);
      json.likes = story.likes || 0;
      json.comments = (json.storyComments || []).map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        user: c.user,
      }));
      json.commentsCount = json.comments.length;
      if (story.userId === userId) {
        json.likers = likersByStory[story.id] || [];
        json.isOwn = true;
      }
      delete json.storyComments;
      return json;
    });

    res.json(payload);
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({ message: 'Error fetching stories', error: error.message });
  }
};

// Create a new story
const createStory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mediaUrl, mediaType = 'image' } = req.body;
    const caption = normalizeText(req.body.caption);

    if (!mediaUrl) {
      return res.status(400).json({ message: 'Media URL is required' });
    }

    if (rejectIfSensitive(res, caption, 'caption')) return;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const story = await Story.create({
      userId,
      mediaUrl,
      mediaType,
      caption: caption || null,
      expiresAt,
    });

    const createdStory = await Story.findByPk(story.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar'],
        },
      ],
    });

    const json = createdStory.toJSON();
    json.isLiked = false;
    json.comments = [];
    json.commentsCount = 0;

    res.status(201).json(json);
  } catch (error) {
    console.error('Error creating story:', error);
    res.status(500).json({ message: 'Error creating story', error: error.message });
  }
};

// Delete a story
const deleteStory = async (req, res) => {
  try {
    const userId = req.user.id;
    const storyId = req.params.id;

    const story = await Story.findByPk(storyId);

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    if (story.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this story' });
    }

    await StoryLike.destroy({ where: { storyId } });
    await StoryComment.destroy({ where: { storyId } });
    await story.destroy();

    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Error deleting story:', error);
    res.status(500).json({ message: 'Error deleting story', error: error.message });
  }
};

// Toggle like on a story (Instagram-style)
const likeStory = async (req, res) => {
  try {
    const userId = req.user.id;
    const storyId = req.params.id;

    const story = await Story.findByPk(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    const existing = await StoryLike.findOne({ where: { storyId, userId } });

    if (existing) {
      await existing.destroy();
      const likes = Math.max(0, (story.likes || 0) - 1);
      await story.update({ likes });
      return res.json({ liked: false, likes, message: 'Story unliked' });
    }

    await StoryLike.create({ storyId, userId });
    const likes = (story.likes || 0) + 1;
    await story.update({ likes });
    return res.json({ liked: true, likes, message: 'Story liked' });
  } catch (error) {
    console.error('Error liking story:', error);
    res.status(500).json({ message: 'Error liking story', error: error.message });
  }
};

// List comments for a story
const getStoryComments = async (req, res) => {
  try {
    const storyId = req.params.id;
    const story = await Story.findByPk(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    const comments = await StoryComment.findAll({
      where: { storyId },
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'avatar'] }],
      order: [['createdAt', 'ASC']],
    });

    res.json(comments);
  } catch (error) {
    console.error('Error fetching story comments:', error);
    res.status(500).json({ message: 'Error fetching story comments', error: error.message });
  }
};

// Add a comment on a story
const addStoryComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const storyId = req.params.id;
    const content = normalizeText(req.body.content);

    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    if (rejectIfSensitive(res, content, 'content')) return;

    const story = await Story.findByPk(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    if (story.expiresAt && new Date(story.expiresAt) < new Date()) {
      return res.status(410).json({ message: 'This story has expired' });
    }

    const comment = await StoryComment.create({ storyId, userId, content });
    const withUser = await StoryComment.findByPk(comment.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'avatar'] }],
    });

    res.status(201).json(withUser);
  } catch (error) {
    console.error('Error commenting on story:', error);
    res.status(500).json({ message: 'Error commenting on story', error: error.message });
  }
};

// Story insights — likes & replies (story owner only, Instagram-style)
const getStoryInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    const storyId = req.params.id;

    const story = await Story.findByPk(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    if (story.userId !== userId) {
      return res.status(403).json({ message: 'Only the story owner can view insights' });
    }

    const [likes, comments] = await Promise.all([
      StoryLike.findAll({
        where: { storyId },
        include: [{ model: User, as: 'user', attributes: ['id', 'username', 'avatar'] }],
        order: [['createdAt', 'DESC']],
      }),
      StoryComment.findAll({
        where: { storyId },
        include: [{ model: User, as: 'user', attributes: ['id', 'username', 'avatar'] }],
        order: [['createdAt', 'ASC']],
      }),
    ]);

    res.json({
      storyId: story.id,
      likesCount: likes.length,
      commentsCount: comments.length,
      likes: likes.map((l) => ({
        id: l.user?.id,
        username: l.user?.username,
        avatar: l.user?.avatar,
        likedAt: l.createdAt,
      })),
      comments: comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        user: c.user,
      })),
    });
  } catch (error) {
    console.error('Error fetching story insights:', error);
    res.status(500).json({ message: 'Error fetching story insights', error: error.message });
  }
};

module.exports = {
  getStories,
  createStory,
  deleteStory,
  likeStory,
  getStoryComments,
  addStoryComment,
  getStoryInsights,
};
