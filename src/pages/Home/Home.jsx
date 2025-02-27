import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./Home.css";
import "./Loading.css";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


function Home() {
  const baseURL = "https://mountain-djyn.onrender.com";
  //const baseURL = "http://localhost:3000";
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendeesAndEvents, setAttendeesAndEvents] = useState([]);
  const [showAttendees, setShowAttendees] = useState(false);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  const exportToPDF = () => {
    const doc = new jsPDF();
   // Ajouter un titre centré
   const title = "List of mountain projects from the Hamilton 10 promotion";
   doc.setFont("helvetica", "bold");
   doc.setFontSize(16);
 
   const pageWidth = doc.internal.pageSize.getWidth();
   const textWidth = doc.getTextWidth(title);
   const textX = (pageWidth - textWidth) / 2; // Centrage horizontal
 
   doc.text(title, textX, 15);
    const tableData = Object.entries(attendeesAndEvents).map(([event, participants]) => [
      event.toUpperCase(),
      participants.length > 0 ? participants.join(", ") : "No candidates",
    ]);
  
    autoTable(doc, {
      head: [["Project", "Candidates"]],
      body: tableData,
      startY: 22, // Pour éviter que le titre ne chevauche le tableau
    });
  
  // Ajouter la date de génération en bas de page
  const date = new Date().toLocaleDateString();
  const footerText = `Generated on: ${date}`;

  doc.setFontSize(10);
  const footerWidth = doc.getTextWidth(footerText);
  const footerX = (pageWidth - footerWidth) / 2; // Centrage

  const pageHeight = doc.internal.pageSize.getHeight();
  doc.text(footerText, footerX, pageHeight - 10); // Position en bas

  doc.save("Projects_and_candidates.pdf");
  };
  

  //Calcul du nombre de participants pour un événement
  function getTotalParticipants(event) {
    const uniqueParticipants = new Set();
  
    if (!event.dates || event.dates.length === 0) return 0; // Vérifie si "dates" est vide
  
    event.dates.forEach((date) => {
      if (!date.attendees || date.attendees.length === 0) return; // Vérifie si "attendees" existe
  
      date.attendees.forEach((attendee) => {
          uniqueParticipants.add(attendee.name);
      });
    });
  
    return uniqueParticipants.size;
  }  

  //Suppression d'un événement
  const handleRemoveEvent = async (eventToRemove) => {
    const result = await Swal.fire({
      title: "Are you sure ?",
      text: "This action is irreversible !",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, continue",
      cancelButtonText: "No, cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const routeURL = `/api/events/${eventToRemove.id}`;
      await axios.delete(baseURL + routeURL);
      setEvents((prevEvents) =>
        prevEvents.filter((event) => event.id !== eventToRemove.id)
      );
      //alert("Projet supprimé avec succès !");

      if (showAttendees) {
        handleShowAttendeeAndEvents();
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du projet: ", error);
      alert("Impossible de supprimer le projet.");
    }
  };

  //Liste les participants et les événements associés
  const handleShowAttendeeAndEvents = async () => {
    if (loadingAttendees) return; //Pour empêcher le clic intempestif

    if (!showAttendees) {
      setLoadingAttendees(true);

      try {
        const routeURL = "/api/attendees";
        const response = await axios.get(baseURL + routeURL);

        //Regrouper les participants par événément
        const eventToParticipantsMap = {};

        response.data.forEach((participant) => {
          participant.events?.forEach((event) => {
            if (!eventToParticipantsMap[event.name]) {
              eventToParticipantsMap[event.name] = [];
            }
            eventToParticipantsMap[event.name].push(participant.name);
          });
        });

        setAttendeesAndEvents(eventToParticipantsMap);

        //alert("Données chargées avec succès !");
      } catch (error) {
        console.error("Erreur lors du chargement des données: ", error);
        alert("Impossible de charger les données.");
      }
      setLoadingAttendees(false);
    }

    setShowAttendees(!showAttendees); //Toggle de l'affichage
  };

  useEffect(() => {
    const routeURL = "/api/events";
    axios
      .get(baseURL + routeURL)
      .then((response) => {
        setEvents(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erreur de chargement du fichier JSON:", error);
        setError(error);
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <div id="loader">
        <div name="spinner-container">
          <svg className="text-circle" viewBox="0 0 100 100">
            <path
              id="circlePath"
              d="M 50,50 m -35,0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0"
              stroke="transparent"
              fill="none"
            />
            <text stroke="black" strokeWidth="2" fill="transparent">
              {/*Contour du texte*/}
              <textPath href="#circlePath" startOffset="0%">
                LOADING...
              </textPath>
            </text>
            {/*Texte coloré au-dessus*/}
            <text fill="white">
              <textPath href="#circlePath" startOffset="0%">
                LOADING...
              </textPath>
            </text>
          </svg>
          <div className="spinner"></div>
        </div>
      </div>
    );

  if (error) return <p>Erreur: {error.message}</p>;

  return (
    <>
      <div id="event-card" className="banner">
        <div className="header">
          <h1>Mountain Bookstore</h1>
          <Link to="/api/event">
            <button className="create-event-button">Add a project</button>
          </Link>
        </div>
        <div className="event-grid">
          {events.length > 0 ? (
            events.map((event) => (
              <div key={event.id} className="event-card">
                <h2>
                  <Link to={`/api/events/${event.id}`} className="link-event">
                    {event.name.length > 16
                      ? event.name.slice(0, 16) + "..."
                      : event.name}
                  </Link>
                </h2>
                <p>Author : {event.author}</p>
                <p>Candidates : {getTotalParticipants(event)}</p>
                <button onClick={() => handleRemoveEvent(event)}>Delete</button>
              </div>
            ))
          ) : (
            <p>No projects found.</p>
          )}
        </div>
        {events.length > 0 && (
          <Link to="#" onClick={handleShowAttendeeAndEvents}>
            <br />
            {showAttendees ? "Hide the view" : "Summary view"}
          </Link>
        )}

        {showAttendees && (
          <div className="participant-container">
            <h2>List of projects and candidates</h2>
            <button onClick={exportToPDF}>Export to PDF</button>

            {loadingAttendees ? (
              <p>Loading candidates...</p>
            ) : Object.keys(attendeesAndEvents).length > 0 ? (
              <div className="participant-grid">
                {Object.entries(attendeesAndEvents).map(
                  ([event, participants], index) => (
                    <div key={index} className="participant-card">
                      <h3>{event.toUpperCase()}</h3>
                      <ul className="event-list">
                        {participants.length > 0 ? (
                          participants.map((participant, participantIndex) => (
                            <li key={participantIndex}>{participant}</li>
                          ))
                        ) : (
                          <li>No candidates</li>
                        )}
                      </ul>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p>No projects found.</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default Home;
