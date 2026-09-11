import uvicorn

if __name__ == '__main__':
    print("Starting Jaipur Green Corridor AI Traffic Management System on http://localhost:8000 ...")
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
