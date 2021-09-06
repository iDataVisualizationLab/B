# Run this app with `python app.py` and
# visit http://127.0.0.1:8050/ in your web browser.
import json
import numpy as np

import dash
import dash_core_components as dcc
import dash_html_components as html
from dash.dependencies import Input, Output, State
import plotly.express as px

import processing
import numpy_to_json

external_stylesheets = ['https://codepen.io/chriddyp/pen/bWLwgP.css']

app = dash.Dash(__name__, external_stylesheets=external_stylesheets)

file_list = [
    'data/file_1.json',
    'data/file_2.json',
]

app.layout = html.Div([

    html.Div(id='control-panel', children=[
        html.H6('File selection:'),
        html.Br(),
        dcc.Dropdown(
            id='file-selection',
            options=[{'label': i, 'value': i} for i in file_list],
            value=file_list[0],
        ),
        html.Br(),
        html.H6('Number of neighbors in LOF computation:'),
        html.Br(),
        dcc.Slider(
            id='neighbor-selection',
            min=1,
            max=50,
            value=5,
            marks={str(i): str(i) for i in range(1, 51)},
            step=1,
        ),
        html.Br(),
        html.H6('Smallest LOF to be considered as outlier:'),
        html.Br(),
        dcc.Slider(
            id='threshold-selection',
            min=1.2,
            max=2,
            value=1.5,
            marks={str(i / 10): str(i / 10) for i in range(12, 21)},
            step=0.1,
        ),
        html.Br(),
        html.H6('Shortest sequence of consecutive outliers to be considered as anomaly:'),
        html.Br(),
        dcc.Slider(
            id='limit-selection',
            min=10,
            max=100,
            value=10,
            marks={str(i): str(i) for i in range(10, 105, 5)},
            step=5,
        ),
        html.Br(),
        html.H6('Window size selection:'),
        html.Br(),
        dcc.Slider(
            id='window-size-selection',
            min=5,
            max=100,
            value=60,
            marks={str(i): str(i) for i in range(5, 105, 5)},
            step=5,
        ),
        html.Br(),
        html.H6('Stride between windows:'),
        html.Br(),
        dcc.Slider(
            id='stride-selection',
            min=1,
            max=10,
            value=1,
            marks={str(i): str(i) for i in range(1, 11)},
            step=1,
        )
    ], style={'width': '40%', 'display': 'inline-block'}),

    html.Div(
        children=[
            html.Div(
                id='metric-plot-div',
                children=[
                    dcc.Graph(id='metric-plot'),
                ],
            ),

            html.Br(),

            html.Div(
                id='dr-plot-div',
                children=[],
            ),
        ],
        style={'width': '40%', 'display': 'inline-block', 'position': 'absolute', 'top': '0'},
    ),

    html.Br(),

    html.Div(
        id='time-series-div',
        children=[],
        style={'width': '100%', 'display': 'inline-block', 'position': 'relative', 'top': '10'},
    ),

    dcc.Store(id='data-storage'),

    dcc.Store(id='my-control'),

])


@app.callback(
    Output('metric-plot', 'figure'),
    Output('data-storage', 'data'),
    Input('file-selection', 'value'),
    Input('neighbor-selection', 'value'),
    Input('threshold-selection', 'value'),
    Input('limit-selection', 'value'),
    Input('window-size-selection', 'value'),
    Input('stride-selection', 'value')
)
def update_metric_plot(file, k, threshold, limit, w, s):
    # computation
    data = processing.process_data.run(file, k, threshold, limit, w, s)

    # get data for metric plot
    dp = {
        'clumpy': [],
        'anomaly': [],
        'instance': [],
    }
    for i in data['metrics']:
        dp['instance'].append(i)
        dp['clumpy'].append(data['metrics'][i]['clumpy'])
        dp['anomaly'].append(data['metrics'][i]['anomaly'])

    fig = px.scatter(dp, x='anomaly', y='clumpy', hover_name='instance', size_max=5)
    fig.update_xaxes(range=[0, 1])
    fig.update_yaxes(range=[0, 1])
    fig.update_layout(clickmode='event+select')
    fig.update_layout(margin={'t': 20})

    return fig, json.dumps(data, cls=numpy_to_json.encoder.NumpyArrayEncoder)


@app.callback(
    Output('dr-plot-div', 'children'),
    Input('metric-plot', 'clickData'),
    Input('file-selection', 'value'),
    Input('neighbor-selection', 'value'),
    Input('threshold-selection', 'value'),
    Input('limit-selection', 'value'),
    Input('window-size-selection', 'value'),
    Input('stride-selection', 'value'),
    State('data-storage', 'data'),
)
def update_dr_plot(click_input, file, k, threshold, limit, w, s, data_storage):
    children = []

    ctx = dash.callback_context
    if not ctx.triggered:
        check = False
    else:
        if ctx.triggered[0]['prop_id'].split('.')[0] == 'metric-plot':
            check = True
        else:
            check = False

    if check:
        instance = click_input['points'][0]['hovertext']
        data = json.loads(data_storage)
        dp = {
            'the first component': [],
            'the second component': [],
            'w_index': []
        }
        for i in range(len(data['dr'][instance]['transformation'])):
            t = data['dr'][instance]['transformation'][i]
            dp['the first component'].append(t[0])
            dp['the second component'].append(t[1])
            dp['w_index'].append(i)
        fig = px.line(dp, x='the first component', y='the second component',
                      custom_data=['w_index'], markers=True)
        fig.update_traces(line=dict(width=0.5))
        fig.update_traces(marker=dict(size=4))
        fig.update_layout(dragmode='select')
        fig.update_layout(margin={'t': 0})
        children = [
            dcc.Graph(
                id='dr-plot',
                figure=fig,
            ),
        ]
    else:
        children = children[:-1]

    return children


@app.callback(
    Output('time-series-div', 'children'),
    Input('dr-plot', 'selectedData'),
    Input('metric-plot', 'clickData'),
    Input('file-selection', 'value'),
    Input('neighbor-selection', 'value'),
    Input('threshold-selection', 'value'),
    Input('limit-selection', 'value'),
    Input('window-size-selection', 'value'),
    Input('stride-selection', 'value'),
    State('data-storage', 'data'),
)
def update_time_series_plot(selected_data, click_data, file, k, threshold, limit, w, s, data_storage):
    children = []

    ctx = dash.callback_context
    if not ctx.triggered:
        check = False
    else:
        if ctx.triggered[0]['prop_id'].split('.')[0] == 'dr-plot':
            check = True
        else:
            check = False

    if check and selected_data:
        data = json.loads(data_storage)
        t_list = []
        for p in selected_data['points']:
            t = s*p['customdata'][0]
            for i in range(t, t + w):
                t_list.append(i)
        t_list = set(t_list)
        df = {
            'time': data['data']['timestamp'],
            'color': [],
        }
        t_intersection = list(t_list & set(range(0, len(df['time']))))
        for i in range(len(df['time'])):
            if i in t_intersection:
                df['color'].append('selected points')
            else:
                df['color'].append('others')
        instance = click_data['points'][0]['hovertext']
        for v in data['data'][instance]:
            df[v] = data['data'][instance][v]
        for v in data['data'][instance]:
            fig = px.line(df, x='time', y=v, markers=True, color='color')
            fig.update_traces(line=dict(width=0.5))
            fig.update_traces(marker=dict(size=4))
            children.append(
                dcc.Graph(figure=fig)
            )
    else:
        children = children[:-1]

    return children


if __name__ == '__main__':
    app.run_server(debug=True)
