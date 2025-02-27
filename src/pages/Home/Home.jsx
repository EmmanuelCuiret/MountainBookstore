import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./Home.css";
import "./Loading.css";
import Swal from "sweetalert2";

function Home() {
  const baseURL = "https://mountain-djyn.onrender.com";
  //const baseURL = "http://localhost:3000";
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendeesAndEvents, setAttendeesAndEvents] = useState([]);
  const [showAttendees, setShowAttendees] = useState(false);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  //Calcul du nombre de participants pour un événement
  function getTotalParticipants(event) {
    const uniqueParticipants = new Set();

    event.dates?.forEach((date) => {
      date.attendees?.forEach((attendee) => {
        if (attendee.available) {
          uniqueParticipants.add(attendee.name);
        }
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
      setEvents((prevEvents) => prevEvents.filter((event) => event.id !== eventToRemove.id));
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

    setShowAttendees(!showAttendees); //Toggle de l'affichage

    if (!showAttendees) {
      setLoadingAttendees(true);

      try {
        const routeURL = "/api/attendees";
        const response = await axios.get(baseURL + routeURL);

        const participants = response.data
          .filter((participant) => participant.events?.length > 0)
          .map((participant) => ({
            name: participant.name,
            events: participant.events.map((event) => event.name),
          }));

        setAttendeesAndEvents(participants);

        //alert("Données chargées avec succès !");
      } catch (error) {
        console.error("Erreur lors du chargement des données: ", error);
        alert("Impossible de charger les données.");
      }
      setLoadingAttendees(false);
    }
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
          <svg className ="text-circle" viewBox="0 0 100 100">
            <path id="circlePath" d="M 50,50 m -35,0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" stroke="transparent" fill="none" />
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
          <div className ="spinner"></div>
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
                  {event.name.length > 16 ? event.name.slice(0, 16) + "..." : event.name}
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
        <br/>
        {showAttendees ? "Hide list" : "View applications"}
        </Link>
        )}

        {showAttendees && (
          <div className="participant-container">
            <h2>List of applications</h2>

            {loadingAttendees ? (
              <p>Loading candidates...</p>
            ) : attendeesAndEvents.length > 0 ? (
              <div className="participant-grid">
                {attendeesAndEvents.map((a, index) => (
                  <div key={index} className="participant-card">
                    <strong>{a.name.toUpperCase()}</strong>
                    <ul className="event-list">
                      {a.events.map((event, eventIndex) => (
                        <li key={eventIndex}>{event}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p>No candidates.</p>
            )}
          </div>
        )}

      </div>     
    </>
  );
}

export default Home;
