import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./CreateEvent.css";
import { Link } from "react-router-dom";

const CreateEvent = () => {
  const dateDuJour = new Date().toISOString().split("T")[0]; // Date du jour au format "YYYY-MM-DD"
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [dates] = useState([dateDuJour]); // La date du jour est fixée dès le départ
  const navigate = useNavigate();
  const baseURL = "https://mountain-djyn.onrender.com";
  //const baseURL = "http://localhost:3000";
  const routeURL = "/api/events";
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sanitizeInput = (value) => value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ0-9 .,'@-]/g, ""); // Filtrage des caractères autorisés

  // Création de l'événement
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !description.trim() || !author.trim()) {
      setIsSubmitting(true);
      return;
    }

    const newEvent = {
      name,
      description,
      author,
      dates
    };

    try {
      await axios.post(baseURL + routeURL, newEvent);
      navigate("/");
    } catch (error) {
      console.error("Erreur lors de la création de l'événement :", error);
    }
  };

  return (
    <div className="container">
      <h2>Create a project</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="author">Author :</label>
          <input 
            type="text" 
            id="author" 
            value={author} 
            onChange={(e) => setAuthor(sanitizeInput(e.target.value))} 
            className={isSubmitting && !author.trim() ? "input-error" : ""} 
          />
          {isSubmitting && !author.trim() && <p className="error-message">Author name is required</p>}
        </div>

        <div>
          <label htmlFor="eventName">Title :</label>
          <input 
            type="text" 
            id="eventName" 
            value={name} 
            onChange={(e) => setName(sanitizeInput(e.target.value))} 
            className={isSubmitting && !name.trim() ? "input-error" : ""} 
          />
          {isSubmitting && !name.trim() && <p className="error-message">Project name is required</p>}
        </div>

        <div>
          <label htmlFor="description">Description :</label>
          <textarea 
            id="description" 
            rows="5" 
            value={description} 
            onChange={(e) => setDescription(sanitizeInput(e.target.value))} 
            className={isSubmitting && !description.trim() ? "input-error" : ""} 
          />
          {isSubmitting && !description.trim() && <p className="error-message">Description is required</p>}
        </div>

        <div className="buttons">
          <button type="submit">Create</button>
          <Link to="/">
            <button type="button" className="button">Cancel</button>
          </Link>
        </div>
      </form>
    </div>
  );
};

export default CreateEvent;
