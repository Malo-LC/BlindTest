import React from 'react';

import './HistoriqueMusiques.css';

export function Historique({ liste }) {
  if (liste.length === 0) {
    return <div></div>;
  } else
    return (
      <div className="historique">
        <p className="titreHisto">Historique des musiques :</p>
        {liste
          .slice(0)
          .reverse()
          .map((element, i) => (
            <div className="Musique" key={i}>
              <img alt="miniature" className="Minia" src={element.photo} />
              <p className="NomMusique">{element.nom} </p>
            </div>
          ))}
      </div>
    );
}
