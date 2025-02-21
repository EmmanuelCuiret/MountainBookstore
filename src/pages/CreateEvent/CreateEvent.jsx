import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./CreateEvent.css";
import { Link } from "react-router-dom";

const CreateEvent = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [dates, setDates] = useState([]);
  const [dateInput, setDateInput] = useState("");
  const navigate = useNavigate();

  const baseURL = "https://didlydoo-at29.onrender.com";
  //const baseURL = "http://localhost:3000";
  const routeURL = "/api/events";
  const [isSubmitting, setIsSubmitting] = useState(false); //Utilisé pour afficher les messages d'erreur uniquement lors de la soumission du formulaire
  const [errorDate, setErrorDate] = useState(false);
  const sanitizeInput = (value) => value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ0-9 .,'@-]/g, ""); //Filtre sur les caractères admis à la saisie

  //Création de l'événement
  const handleSubmit = async (e) => {
    e.preventDefault();

    //Vérifie que tous les champs sont remplis avant de soumettre le formulaire
    if (!name.trim() || !description.trim() || !author.trim()) {
      setIsSubmitting(true); //Active la validation
      return; //Affiche les messages d'erreur
    }

    const newEvent = {
      name,
      description,
      author,
      dates,
    };

    try {
      await axios.post(baseURL + routeURL, newEvent);
      //alert("Événement créé avec succès !");
      navigate("/"); // Redirection vers la liste des événements
    } catch (error) {
      console.error("Erreur lors de la création de l'événement :", error);
    }
  };

  //Evénement qui supprime une date sélectionnée
  const handleRemoveDate = (dateToRemove) => {
    setDates(dates.filter((date) => date !== dateToRemove));
  };

  // Ajout d'une date
  const handleAddDate = (e) => {
    const newDate = e.target.value;
    setDateInput(newDate); // Mettre à jour l'état pour que l'input reflète la sélection

    // Vérifier que la date n'est pas vide et qu'elle n'est pas antérieure à aujourd'hui
    if (!newDate.trim() || new Date(newDate) < new Date()) {
      setErrorDate(true);
      return;
    }

    // Ajouter la date si elle n'existe pas déjà dans le tableau
    if (!dates.includes(newDate)) {
      const sortedDates = [...dates, newDate].sort((a, b) => Date.parse(a) - Date.parse(b));
      setDates(sortedDates);
      setErrorDate(false);
    }
  };

  return (
    <div className="container">
      <h2>Créer un projet</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="eventName">Nom :</label>
          <input type="text" id="eventName" value={name} onChange={(e) => setName(sanitizeInput(e.target.value))} className={isSubmitting && !name.trim() ? "input-error" : ""} />
          {isSubmitting && !name.trim() && <p className="error-message">Le nom de l'événement est obligatoire</p>}
        </div>

        <div>
          <label htmlFor="description">Description :</label>
          <textarea id="description" rows="15" value={description} onChange={(e) => setDescription(sanitizeInput(e.target.value))} className={isSubmitting && !description.trim() ? "input-error" : ""} />
          {isSubmitting && !description.trim() && <p className="error-message">La description est obligatoire</p>}
        </div>

        <div>
          <label htmlFor="author">Auteur :</label>
          <input type="text" id="author" value={author} onChange={(e) => setAuthor(sanitizeInput(e.target.value))} className={isSubmitting && !author.trim() ? "input-error" : ""} />
          {isSubmitting && !author.trim() && <p className="error-message">Le nom de l'auteur est obligatoire</p>}
        </div>

        <div className="buttons">
          <button type="submit">Créer</button>
          <Link to="/">
            <button className="button">Annuler</button>
          </Link>
        </div>
      </form>
    </div>
  );
};

export default CreateEvent;
