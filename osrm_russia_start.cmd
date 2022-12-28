cd OSRM_russia
docker run -t -i -p 5000:5000 -v "%CD%:/data" ghcr.io/project-osrm/osrm-backend osrm-routed --algorithm mld /data/russia-latest.osrm