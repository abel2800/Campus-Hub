import React, { useState, useEffect } from "react";
import axios from "axios";

const SocialMediaFeed = () => {
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const response = await axios.get("/api/posts/feed");
            setPosts(response.data);
        } catch (err) {
            console.error("Error fetching posts:", err);
        }
    };

    return (
        <div>
            <h1>Social Media Feed</h1>
            {posts.map((post) => (
                <div key={post.id} className="post">
                    <h3>{post.full_name}</h3>
                    <img src={post.media_url} alt="Post" />
                    <p>{post.caption}</p>
                    <div>
                        <span>{post.like_count} Likes</span>
                        <span>{post.comment_count} Comments</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SocialMediaFeed;
