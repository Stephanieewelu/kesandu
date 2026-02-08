import streamlit as st

st.set_page_config(page_title="Kesandu Dashboard", layout="wide")
st.title("Kesandu Dashboard")

col1, col2 = st.columns(2)
with col1:
    st.metric("Total XP", 0)
    st.metric("Level", 0)
with col2:
    st.metric("Day Streak", 0)
    st.metric("Badges", 0)

url = st.text_input("Kesandu Web URL", "http://localhost:19006")
st.components.v1.html(
    f'<iframe src="{url}" style="width:100%;height:80vh;border:0;"></iframe>',
    height=800
)
