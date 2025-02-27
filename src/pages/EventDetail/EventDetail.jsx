import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "./EventDetail.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const EventDetail = () => {
  const { id } = useParams(); // Récupère l'ID de l'événement depuis l'URL
  const baseURL = "https://mountain-djyn.onrender.com";
  //const baseURL = "http://localhost:3000";
  const sanitizeInput = (value) => value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ0-9 .,'@-]/g, ""); //Filtre sur les caractères admis à la saisie
  const [noAttendee, setNoAttendee] = useState(true); //Pour la vérification qu'il y a au moins un participant d'inscrit à l'événement
  const [event, setEvent] = useState(null);
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modif, setModif] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [attendeeDates, setAttendeeDates] = useState([]); //Les dates d'un participant
  const [attendeeName, setAttendeeName] = useState(""); //Nom d'un participant
  const [attendeeNameForAdd, setAttendeeNameForAdd] = useState("");
  const [attendeeNameForParticipationsDetail, setAttendeeNameForParticipationsDetail] = useState("");
  const [attendeeNameForChangingDates, setAttendeeNameForChangingDates] = useState("");
  const [editingAttendee, setEditingAttendee] = useState(null);
  const [selectedDates, setSelectedDates] = useState([]); //Dates cochées par l'utilisateur
  const [isSubmitting, setIsSubmitting] = useState(false); //Utilisé pour afficher les messages d'erreur uniquement lors de la soumission du formulaire
  const [isSubmittingNewDate, setIsSubmittingNewDate] = useState(false);
  const [isSubmittingModifChoices, setIsSubmittingModifChoices] = useState(false); //Pour la modication des choix de dates d'un participant à un événément

  const [dateInput, setDateInput] = useState(""); //L'ajout d'une nouvelle date
  const [showAttendeeDetails, setShowAttendeeDetails] = useState(false);

  const fetchEvent = async () => {
    try {
      const routeURL = `/api/events/${id}`;
      const response = await axios.get(baseURL + routeURL);
      setEvent(response.data); // Met à jour l'état avec les nouvelles données
    } catch (error) {
      console.error("Erreur lors de la récupération de l'événement :", error);
      setError("Evénement non trouvé");
    } finally {
      setLoading(false);
    }
  };

  //Rerender en cas d'ajout d'événement
  useEffect(() => {
    // Fonction pour récupérer les détails de l'événement
    fetchEvent();
  }, [id]); // L'effet sera déclenché à chaque fois que l'ID change

  //Gestion du changement des cases à cocher
  const toggleDateSelection = (date) => {
    setSelectedDates((prevSelectedDates) => {
      // Vérifie si la date est déjà sélectionnée
      if (prevSelectedDates.some((d) => d.date === date)) {
        // Si oui, on l'enlève
        return prevSelectedDates.filter((d) => d.date !== date);
      } else {
        // Sinon, on l'ajoute
        return [...prevSelectedDates, { date, available: true }];
      }
    });
  };

  //Préparation de l'état
  const handleEditAttendee = (attendee) => {
    setEditingAttendee(attendee);
    setAttendeeName(attendee.name);
    setAttendeeDates(attendee.dates);
    setAttendeeNameForChangingDates(attendee.name);
  };

  //Mise à jour du participant
  const handleUpdateAttendee = async () => {
    try {
      if (attendeeDates.length === 0) {
        setIsSubmittingModifChoices(true);
        return;
      }
      const updateAttendee = {
        name: attendeeName,
        dates: attendeeDates.map((d) => ({ date: d, available: true })),
      };
      const routeURL = `/api/events/${id}/attend`;
      await axios.patch(baseURL + routeURL, updateAttendee);

      await fetchEvent();
      setEditingAttendee(null);
      setIsSubmitting(false);
      // Une fois la mise à jour terminée, recharger les détails du participant
      if (showAttendeeDetails) handleShowAttendeeDetails(attendeeNameForParticipationsDetail);
      toast.success("Participant mis à jour avec succès !");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du participant: ", error);
      toast.error("Erreur lors de la mise à jour du participant.");
    }
  };

  //Soumission du formulaire pour ajouter un participant
  const handleAddAttendee = async (e) => {
    e.preventDefault();

    // Vérifications
    if (!attendeeNameForAdd || !attendeeNameForAdd.trim()) {
      setIsSubmitting(true); // Active la validation
      return;
    }

     // Demande de confirmation d'ajout de candidat avec SweetAlert2
     const result = await Swal.fire({
      title: "Confirm addition",
      html: `
        <p>Add this candidate ?</p>
        <strong>Nom :</strong> "${attendeeNameForAdd}"<br/>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, add",
      cancelButtonText: "No, cancel",
    });

    // Si l'utilisateur annule, on stoppe ici
    if (!result.isConfirmed) return;

    const routeURL = `/api/events/${id}/attend`;

    const newParticipant = {
      name: attendeeNameForAdd,
      dates: selectedDates.map((d) => ({
        date: d.date,
        available: d.available,
      })),
    };

    try {
      await axios.post(baseURL + routeURL, newParticipant);
      await fetchEvent(); // Pour récupérer les données mises à jour
      toast.success("Participant ajouté avec succès !");
      setAttendeeNameForAdd(""); // Réinitialisation du formulaire
      setSelectedDates([]);
      setIsSubmitting(false);
    } catch (error) {
      console.error("Erreur lors de l'ajout du participant :", error);
      toast.error("Erreur lors de la mise à jour du participant");
    }
  };

  const handleCancelAddAttendee = () => {
    // Réinitialisation du formulaire
    setAttendeeNameForAdd("");
    setSelectedDates([]);
    setIsSubmitting(false);
    setIsSubmittingNewDate(false);
  };

  //Initialisation des états quand l'événement est chargé
  useEffect(() => {
    if (event) {
      setName(event.name || "");
      setDescription(event.description || "");
      setAuthor(event.author || "");
    }
  }, [event]);

  // Modifier l'événement
  const handleSubmitModif = async (e) => {
    e.preventDefault();

    //Vérifie que tous les champs sont remplis avant de soumettre le formulaire
    if (!name.trim() || !description.trim() || !author.trim()) {
      setIsSubmitting(true); //Active la validation
      return; //Affiche les messages d'erreur
    }

    const updatedFields = {
      name: name || event.name,
      description: description || event.description,
      author: author || event.author,
    };

    try {
      const routeURL = `/api/events/${id}`;
      await axios.patch(baseURL + routeURL, updatedFields);
      //Fusionner les nouvelles données avec l'événement existant
      setEvent((prevEvent) => ({
        ...prevEvent, //Garde les anciennes valeurs
        ...updatedFields, //Applique les changements
      }));
      toast.success("Événement modifié avec succès !");
      setModif(false);
    } catch (error) {
      console.error("Erreur lors de la modification de l'événement :", error);
      toast.error("Erreur lors de la modification de l'événement.");
    }
  };


  const handleShowAttendeeDetails = async (name) => {
    try {
      const routeURL = `/api/attendees/${name}`;
      const response = await axios.get(baseURL + routeURL);
      setEvents(response.data.events);
      setAttendeeNameForParticipationsDetail(name);
      setShowAttendeeDetails(true);
    } catch (err) {
      console.log("Erreur lors de la récupération des participations du participants :", err);
      setError("Erreur lors de la récupération des participations du participants");
    } finally {
      setLoading(false);
    }
  };

  //Suppression d'un participant à un événement
  const handleDeleteAttendee = async (eventId, attendeeName, e) => {
    e.preventDefault();

    const result = await Swal.fire({
      title: "Confirm deletion",
      html: `
        <p>Are you sure you want to remove this candidate?</p>
        <strong>Name:</strong> "${attendeeName}"<br/>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "No, cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;
    
    try {
      const routeURL = `/api/events/${eventId}/attendees/${attendeeName}`;
      await axios.delete(baseURL + routeURL);
      await fetchEvent();
      toast.success("Participant supprimé avec succès!");
    } catch (err) {
      console.log("Erreur lors de la suppression du participant :", err);
      toast.error("Erreur lors de la suppression du participant.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!event) return <div>No project found.</div>; //Evite une erreur si event est null

  return (
    <div className="event-detail-container">
      {modif ? (
        // Mode modification
        <div className="event-card-no-scale">
          <h2 style={{ textAlign: "center" }}>Edit the project</h2>
          <form onSubmit={handleSubmitModif} className="form-modif">
            <div className="form-group">
              <label htmlFor="eventName">Title :</label>
              <input type="text" id="eventName" value={name} onChange={(e) => setName(sanitizeInput(e.target.value))} className={isSubmitting && !name.trim() ? "input-error" : ""} />
              {isSubmitting && !name.trim() && <p className="error-message">Project name is required</p>}
            </div>
            <div className="form-group">
              <label htmlFor="author">Author :</label>
              <textarea value={author} rows="1" id="author" onChange={(e) => setAuthor(sanitizeInput(e.target.value))} className={isSubmitting && !author.trim() ? "input-error" : ""} />
              {isSubmitting && !author.trim() && <p className="error-message">Author name is required</p>}
            </div>
            <div className="form-group">
              <label htmlFor="description">Description :</label>
              <textarea id="description" rows="15" value={description} onChange={(e) => setDescription(sanitizeInput(e.target.value))} className={isSubmitting && !description.trim() ? "input-error" : ""} />
              {isSubmitting && !description.trim() && <p className="error-message">Description is required</p>}
            </div>
            <div className="form-actions">
              <button type="submit">Save</button>
              <button type="button" onClick={() => setModif(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        // Mode affichage
        <div className="event-card-no-scale">
          <h1 className="link-event">{event.name.toUpperCase()}</h1>
          <p>
            <strong>Author:</strong> {event.author}
          </p>
          <p>
            <strong>Description:</strong> {event.description}
          </p>
          <button className="edit-event-button" onClick={() => setModif(true)}>
            Edit the project
          </button>
          {/*
          <h3>Attendees:</h3>
          {Array.isArray(event.dates) && event.dates.length > 0 ? (
            <table border="1" cellPadding="5">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Attendee</th>
                  <th>Availability</th>
                </tr>
              </thead>
              <tbody>
                {event.dates.map((date, dateIndex) =>
                  Array.isArray(date.attendees) && date.attendees.length > 0 ? (
                    date.attendees.map((attendee, attendeeIndex) => (
                      <tr key={`${dateIndex}-${attendeeIndex}`}>
                        {attendeeIndex === 0 && <td rowSpan={date.attendees.length}>{date.date}</td>}
                        <td>{attendee.name}</td>
                        <td style={{ color: attendee.available ? "green" : "red" }}>
                          <FontAwesomeIcon icon={attendee.available ? faCheck : faTimes} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr key={dateIndex}>
                      <td>{date.date}</td>
                      <td colSpan="2">No attendees for this date</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
           ) : (
            <p>No available dates</p>
          )}
*/}

          <h3 style={{ textAlign: "center" }}>Candidats</h3>

          <div className="participant-section">
              <table className="participant-table" cellPadding="5">
                <thead>
                  <tr>
                  <th>Candidate</th>
                  <th style={{ width: "150px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const attendeesMap = new Map();
                    event.dates.forEach((date) => {
                      date.attendees.forEach((attendee) => {
                        if (!attendeesMap.has(attendee.name)) {
                          attendeesMap.set(attendee.name, {});
                          if (noAttendee === true) setNoAttendee(false);
                        }
                        attendeesMap.get(attendee.name)[date.date] = attendee.available;
                      });
                    });

                    //Si aucun participant d'enregistré
                    if (attendeesMap.size === 0) {
                      return (
                        <tr>
                        <td colSpan="2">No candidates</td>
                      </tr>
                      );
                    }
                    return Array.from(attendeesMap.entries()).map(([name, availability], index) => (
                      <tr key={index} className="participant-row">
                        <td style={{ textAlign: "left", paddingLeft: "20px" }}>
                          <Link to="#" onClick={() => handleShowAttendeeDetails(name)}>
                            {name}
                          </Link>
                        </td>
                        <td>
                          <button type="button" onClick={(e) => handleDeleteAttendee(id, name, e)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
         
          {/* Affichage du formulaire seulement si des dates sont disponibles */}
          {event.dates && event.dates.length > 0 && (
            <div className="attendee-form">
             <h3>Add a candidate</h3>
            <form onSubmit={handleAddAttendee}>
              <label>
                Name :
                <input type="text" value={attendeeNameForAdd} onChange={(e) => setAttendeeNameForAdd(e.target.value)} />
                {isSubmitting && !attendeeNameForAdd && <p className="error-message">Name is required</p>}
              </label>
              <div className="button-group">
                <button type="submit">Add a candidate</button>
                <button type="button" onClick={handleCancelAddAttendee}>
                  Clear
                </button>
                </div>
              </form>
            </div>
          )}
          <div className="back-link">
            <Link to="/">Back to home</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetail;
