import React from 'react';
import * as PropTypes from 'prop-types';

import Navbar from '../about/navbar';
import { Footer } from '../UILibrary/components';

export class CoordDisplayWidget extends React.Component {
    render() {
        const items = [];
        let line;
        for (line of this.props.lineCoords) {
            items.push(<line x1={line['1_x']} y1={line['1_y']} x2={line['2_x']} y2={line['2_y']} />);
        }
        return (
            <div>
                {items}
            </div>
        );
    }
}
CoordDisplayWidget.propTypes = {
    vanishingPointCoord: PropTypes.object,
    lineCoords: PropTypes.object,
};


const SIDES = {
    CLEANED: 'cleaned',
    FRONT: 'front',
    BACK: 'back',
    BINDER: 'binder',
};

function configAnalysisFV(parsedValue) {
    const {
        line_coords: lineCoords,
        vanishing_point_coord: vanishingPointCoord,
    } = parsedValue;
    console.log(parsedValue);
    return (
        <CoordDisplayWidget
            vanishingPointCoord={vanishingPointCoord}
            lineCoords={lineCoords}
        />
    );
}

function configAnalysisFP(parsedValue) {
    return (5);
}

const VISUALANALYSISDICT = {
    'find_vanishing_point': configAnalysisFV,
    'foreground_percentage': configAnalysisFP,
};


function formatPercentageValue(value) {
    return `${parseInt(value)}%`;
}

function formatCoordinate(value) {
    return `(${parseInt(value[0][0])}, ${parseInt(value[0][1])})`;
}

const ANALYSIS_CONFIGS = {
    whitespace_percentage: {
        formatter: formatPercentageValue,
        displayName: '% whitespace',
    },
    photographer_caption_length: {
        displayName: 'Length of photographer caption',
    },
    foreground_percentage: {
        formatter: formatPercentageValue,
        displayName: '% foreground',
    },
    find_vanishing_point: {
        formatter: formatCoordinate,
        displayName: 'Vanishing Point Coordinate',
    },
};

export class PhotoView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            photoData: null,
            displaySide: '',
            availableSides: [],
            view: 0,
            width: 5,
            height: 5,
            imWidth: 0,
        };
        console.log('first call');
        this.onImgLoad = this.onImgLoad.bind(this);
    }

    async componentDidMount() {
        try {
            const apiURL = `/api/photo/${this.props.mapSquareNumber}/${this.props.photoNumber}/`;
            const response = await fetch(apiURL);
            if (!response.ok) {
                this.setState({ loading: false });
            } else {
                const photoData = await response.json();
                const availableSides = Object.values(SIDES)
                    .filter((side) => photoData[`${side}_src`] !== null);
                const displaySide = availableSides.length > 0 ? availableSides[0] : '';
                this.setState({
                    photoData,
                    availableSides,
                    displaySide,
                    loading: false,
                });
            }
        } catch (e) {
            console.log(e);
        }
        // window.addEventListener('resize', this.onImgLoad(i));
    }

    changeSide = (displaySide) => {
        this.setState({ displaySide: displaySide });
    };

    toggleStatus = (event) => {
        this.setState({
            view: parseInt(event.target.value),
        });
    }

    onImgLoad({ target: img }) {
        console.log('IMAGE LOADED');
        this.setState({
            width: img.clientWidth,
            height: img.clientHeight,
        });
    }

    render() {
        if (this.state.loading) {
            return (<h1>
                Loading!
            </h1>);
        }
        if (!this.state.photoData) {
            return (<h1>
                Photo with id {window.location.pathname.split('/')[2]} is not in database.
            </h1>);
        }
        const {
            alt,
            number: photoNumber,
            map_square_number: mapSquareNumber,
            photographer_name: photographerName,
            photographer_number: photographerNumber,
            photographer_caption: photographerCaption,
            analyses,
        } = this.state.photoData;

        return (<>
            <Navbar />
            <div className="page row">
                <div className='image-view col-12 col-lg-6'>
                    <div>
                        <img
                            className='image-photo'
                            src={this.state.photoData[`${this.state.displaySide}_src`]}
                            alt={alt}
                            onLoad={this.onImgLoad}
                        />
                        <svg
                            className='analysis-overlay'
                            height={this.state.height}
                            width={this.state.width}
                        >
                             <line x1="0" y1="0" x2="200" y2="200"/>
                        </svg>
                    </div>
                    <br/>
                    {this.state.availableSides.map((side, k) => (
                        <button key={k} onClick={() => this.changeSide(side)}>
                            {side[0].toUpperCase() + side.slice(1)} Side
                        </button>
                    ))}
                </div>
                <div className='image-info col-12 col-lg-6'>
                    <h5>Map Square</h5>
                    <p>{mapSquareNumber}</p>
                    <h5>Photo number</h5>
                    <p>{photoNumber}</p>
                    <h5>Photographer name</h5>
                    <p>{photographerName || 'Unknown'}</p>
                    <h5>Photographer number</h5>
                    <p>{photographerNumber || 'Unknown'}</p>
                    <h5>Photographer caption</h5>
                    <p>{photographerCaption || 'None'}</p>
                    <div className="row">
                        <div className="col-6">
                            <select
                                id="toggleSelect"
                                className="custom-select"
                                onChange={this.toggleStatus}
                                value={this.state.value}
                            >
                                <option value="0">Select...</option>
                                <option value="1">Perspective Lines</option>
                                <option value="2">Foreground Mask</option>
                            </select>
                        </div>
                    </div>
                    <p>
                        {(() => {
                            switch (this.state.view) {
                            case 0: return 'Nothing selected';
                            case 1: return 'Perspective selected';
                            case 2: return 'Foreground selected';
                            default: return 'Nothing selected';
                            }
                        })()}
                        <br/>
                    </p>

                    {analyses.map((analysisResult, index) => {
                        const analysisConfig = ANALYSIS_CONFIGS[analysisResult.name];
                        const parsedValue = JSON.parse(analysisResult.result);

                        if (analysisResult.name in VISUALANALYSISDICT) {
                            return VISUALANALYSISDICT[analysisResult.name](parsedValue);
                        }

                        let analysisDisplayName;
                        let analysisResultStr = parsedValue;
                        if (!analysisConfig) {
                            analysisDisplayName = analysisResult.name;
                        } else {
                            analysisDisplayName = analysisConfig.displayName;
                            if (analysisConfig.formatter) {
                                analysisResultStr = analysisConfig.formatter(parsedValue);
                            }
                        }
                        return (
                            <React.Fragment key={index}>
                                <h5>{analysisDisplayName}</h5>
                                <p>{analysisResultStr}</p>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
            <Footer />
        </>);
    }
}
PhotoView.propTypes = {
    photoNumber: PropTypes.number,
    mapSquareNumber: PropTypes.number,
};
