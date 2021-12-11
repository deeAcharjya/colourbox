#See https://aka.ms/containerfastmode to understand how Visual Studio uses this Dockerfile to build your images for faster debugging.

FROM mcr.microsoft.com/dotnet/core/aspnet:3.1-buster-slim AS base

RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
	sox ffmpeg wget git make cmake gcc g++ libmad0-dev   libid3tag0-dev libsndfile1-dev libgd-dev \
	libboost-filesystem-dev   libboost-program-options-dev   libboost-regex-dev \
	&& git clone https://github.com/bbc/audiowaveform.git \
	&& cd audiowaveform \
	&& wget https://github.com/google/googletest/archive/release-1.11.0.tar.gz \
	&& tar xzf release-1.11.0.tar.gz \
	&& ln -s googletest-release-1.11.0 googletest \
	&& mkdir build && cd build && cmake .. && make && make package && make install 


WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/core/sdk:3.1-buster AS build
WORKDIR /src
COPY ["server.csproj", ""]
RUN dotnet restore "./server.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "server.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "server.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "server.dll"]