cd OSRM_russia
docker run -t -v "%CD%:/data" ghcr.io/project-osrm/osrm-backend osrm-extract -p /opt/car.lua /data/russia-latest.osm.pbf
docker run -t -v "%CD%:/data" ghcr.io/project-osrm/osrm-backend osrm-partition /data/russia-latest.osrm
docker run -t -v "%CD%:/data" ghcr.io/project-osrm/osrm-backend osrm-customize /data/russia-latest.osrm
pause