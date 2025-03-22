import React, { useState } from "react";
import axios from "axios";

const CreatePost = () => {
    const [caption, setCaption] = useState("");
    const [media, setMedia] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("user_id", 1); // Example user_id
        formData.append("caption", caption);
        formData.append("media_url", media);

        try {
            await axios.post("/api/posts/create", formData);
            alert("Post created successfully!");
        } catch (err) {
            console.error("Error creating post:", err);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="Enter a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
            />
            <input type="file" onChange={(e) => setMedia(e.target.files[0])} />
            <button type="submit">Post</button>
        </form>
    );
};

export default CreatePost;
